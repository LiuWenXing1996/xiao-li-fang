import {
  Color,
  Euler,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { Board } from "../Board";
import { SceneBase } from "../SceneBase";
import UI from "../UI";
import Polyomino from "../Polyomino";
import type PolyominoCube from "../PolyominoCube";
import { GlobalConfig } from "../GlobalConfig";

export default class GameScene extends SceneBase<PerspectiveCamera> {
  board: Board;
  scoreUI: UI;
  score: number = 0;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isDragging: boolean = false;
  pauseUI: UI;
  constructor(renderer: WebGLRenderer) {
    super(renderer);
    this.background = new Color(0x1a1a2e);
    this.board = new Board(10);
    this.add(this.board);
    this.scoreUI = new UI();
    this.add(this.scoreUI);
    this.pauseUI = new UI();
    this.pauseUI.position.set(0, 15, -5);
    this.add(this.pauseUI);
  }
  initCamera() {
    const camera = new PerspectiveCamera(
      45,
      GlobalConfig.targetAspect,
      0.1,
      3000,
    );
    camera.position.set(25, 25, 25);
    camera.lookAt(0, 0, 0);
    return camera;
  }
  init(): void {
    this.board.splitCube();
    this.pauseUI.drawUI("Pause", "#0000ff");
    this.pauseUI.addClickListener(() => {
      console.log("Pause");
    });
    this.scoreUI.position.set(0, 15, 0);
    this.scoreUI.drawUI(`Score: ${this.score}`, "#0000ff");
    const canvas = this.renderer.domElement;
    // 添加触摸事件监听
    this.setupTouchEvents(canvas);
  }
  update(delta: number): void {}
  private setupTouchEvents(canvas: HTMLCanvasElement) {
    // 触摸开始
    canvas.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isDragging = true;
      },
      { passive: false },
    );

    // 触摸移动
    canvas.addEventListener(
      "touchmove",
      (event) => {
        event.preventDefault();
        if (!this.isDragging) return;

        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        const rotationSpeed = 0.01;

        const cameraRight = new Vector3();
        const cameraUp = new Vector3();
        this.camera.matrix.extractBasis(cameraRight, cameraUp, new Vector3());

        this.board.rotation.y += deltaX * rotationSpeed;

        const rightRotation = new Quaternion().setFromAxisAngle(
          cameraRight,
          deltaY * rotationSpeed,
        );
        this.board.quaternion.premultiply(rightRotation);

        const euler = new Euler().setFromQuaternion(this.board.quaternion);
        euler.x = MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2);
        this.board.quaternion.setFromEuler(euler);

        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
      },
      { passive: false },
    );

    // 触摸结束
    canvas.addEventListener(
      "touchend",
      (event) => {
        event.preventDefault();
        this.isDragging = false;
      },
      { passive: false },
    );

    // 鼠标事件支持
    canvas.addEventListener("mousedown", (event) => {
      this.touchStartX = event.clientX;
      this.touchStartY = event.clientY;
      this.isDragging = true;
    });

    canvas.addEventListener("mousemove", (event) => {
      if (!this.isDragging) return;

      const deltaX = event.clientX - this.touchStartX;
      const deltaY = event.clientY - this.touchStartY;

      const rotationSpeed = 0.01;

      const cameraRight = new Vector3();
      const cameraUp = new Vector3();
      this.camera.matrix.extractBasis(cameraRight, cameraUp, new Vector3());

      this.board.rotation.y += deltaX * rotationSpeed;

      const rightRotation = new Quaternion().setFromAxisAngle(
        cameraRight,
        deltaY * rotationSpeed,
      );
      this.board.quaternion.premultiply(rightRotation);

      const euler = new Euler().setFromQuaternion(this.board.quaternion);
      euler.x = MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2);
      this.board.quaternion.setFromEuler(euler);

      this.touchStartX = event.clientX;
      this.touchStartY = event.clientY;
    });

    canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
    });

    // 点击选中 Polyomino
    canvas.addEventListener("click", (event) => {
      this.handleClick(event);
    });
  }

  private handleClick(event: MouseEvent): void {
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const rect = this.renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    // 收集所有 Mesh（包括白色积木）
    const meshes: Object3D[] = [];
    this.board.polyominoList.traverse((child) => {
      if (child.type === "Mesh") {
        meshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(meshes);

    // 从最近的开始检查，跳过白色积木
    let clickedPolyomino: Polyomino | null = null;
    for (const intersect of intersects) {
      const clickedMesh = intersect.object;
      let parent = clickedMesh.parent;
      if (parent) {
        parent = parent.parent;
      }

      if (parent instanceof Polyomino) {
        if (parent.isQuestion) {
          // 如果是白色积木，直接退出检查（不穿透）
          return;
        }
        clickedPolyomino = parent;
        break;
        // 如果是白色积木，继续检查下一个
      }
    }

    if (clickedPolyomino) {
      if (clickedPolyomino.getSelected()) {
        this.removePolyomino(clickedPolyomino);
      } else {
        this.board.polyominoList.traverse((child) => {
          if (child instanceof Polyomino) {
            child.setSelected(false);
          }
        });
        clickedPolyomino.setSelected(true);
      }
    } else {
      // 点击空白处或白色积木，取消所有选中
      this.board.polyominoList.traverse((child) => {
        if (child instanceof Polyomino) {
          child.setSelected(false);
        }
      });
    }
  }
  // 修改 removePolyomino 方法
  private removePolyomino(polyomino: Polyomino): void {
    const cubeCount = polyomino.cubeList.length;
    this.score += cubeCount;
    this.updateScore();

    // 获取被移除积木的所有方块位置
    const removedPositions = new Set<string>();
    polyomino.cubeList.forEach((cube) => {
      const pos = cube.position;
      removedPositions.add(`${pos.x},${pos.y},${pos.z}`);
    });

    // 清理资源
    polyomino.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        if (child.material instanceof MeshBasicMaterial) {
          child.material.dispose();
        }
      } else if (child instanceof LineSegments) {
        child.geometry.dispose();
        if (child.material instanceof LineBasicMaterial) {
          child.material.dispose();
        }
      }
    });

    // 从父容器中移除
    polyomino.parent?.remove(polyomino);

    // 查找并改变周围白色方块的颜色
    this.changeAdjacentWhiteBlocks(removedPositions);
  }
  private changeAdjacentWhiteBlocks(removedPositions: Set<string>): void {
    const directions = [
      { dx: 1, dy: 0, dz: 0 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 },
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
      { dx: 0, dy: 0, dz: -1 },
    ];

    const usedColors = this.board.usedColors;

    if (usedColors.length === 0) {
      return;
    }

    const positionsToChange = new Set<string>();

    removedPositions.forEach((posStr) => {
      const [x, y, z] = posStr.split(",").map(Number);
      directions.forEach((dir) => {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        const nz = z + dir.dz;
        positionsToChange.add(`${nx},${ny},${nz}`);
      });
    });

    // 收集需要处理的方块
    const cubesToProcess: {
      polyomino: Polyomino;
      cube: PolyominoCube;
      color: string;
    }[] = [];

    this.board.polyominoList.traverse((child) => {
      if (child instanceof Polyomino) {
        if (!child.isQuestion) {
          return;
        }

        child.cubeList.forEach((cube) => {
          const posStr = `${cube.position.x},${cube.position.y},${cube.position.z}`;

          if (
            positionsToChange.has(posStr) &&
            cube.isQuestionBlock &&
            !cube.isRevealed
          ) {
            const randomColor =
              usedColors[Math.floor(Math.random() * usedColors.length)];
            cubesToProcess.push({ polyomino: child, cube, color: randomColor });
          }
        });
      }
    });

    // 处理每个需要变色的方块
    cubesToProcess.forEach(({ polyomino, cube, color }) => {
      // 改变方块颜色
      cube.changeColor(color);

      // 从白色积木中移除这个方块
      polyomino.removeCube(cube);

      // 查找周围相同颜色的积木
      const adjacentSameColorPolyominoes = this.findAdjacentSameColorCubes(
        cube,
        color,
      );

      // 如果有相同颜色的相邻积木，合并成一个积木
      if (adjacentSameColorPolyominoes.length > 0) {
        // 收集所有需要合并的方块
        const allCubes: { x: number; y: number; z: number }[] = [];

        // 添加当前变色的方块
        allCubes.push({
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z,
        });

        // 添加相邻积木的所有方块
        adjacentSameColorPolyominoes.forEach((p) => {
          p.cubeList.forEach((c) => {
            allCubes.push({
              x: c.position.x,
              y: c.position.y,
              z: c.position.z,
            });
          });
        });

        // 创建新的合并积木
        const cubesConfig = allCubes.map((pos) => ({
          position: pos,
          color: color,
          isQuestion: false,
        }));

        const newPolyomino = new Polyomino({
          cubes: cubesConfig,
          color: color,
          isQuestion: false,
        });

        // 添加到场景中
        this.board.polyominoList.add(newPolyomino);

        // 移除被合并的积木
        adjacentSameColorPolyominoes.forEach((p) => {
          p.parent?.remove(p);
        });
      } else {
        // 如果没有相邻的相同颜色积木，创建单个方块的积木
        const newPolyomino = new Polyomino({
          cubes: [
            {
              position: {
                x: cube.position.x,
                y: cube.position.y,
                z: cube.position.z,
              },
              color: color,
              isQuestion: false,
            },
          ],
          color: color,
          isQuestion: false,
        });

        this.board.polyominoList.add(newPolyomino);
      }
    });
  }
  updateScore() {
    this.scoreUI.drawUI(`Score: ${this.score}`, "#0000ff");
  }
  // 修改 findAdjacentSameColorCubes 方法
  private findAdjacentSameColorCubes(
    cube: PolyominoCube,
    color: string,
  ): Polyomino[] {
    const directions = [
      { dx: 1, dy: 0, dz: 0 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 1, dz: 0 },
      { dx: 0, dy: -1, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
      { dx: 0, dy: 0, dz: -1 },
    ];

    const foundPolyominoes: Polyomino[] = [];
    const targetPos = cube.position;
    const targetColorHex = new Color(color).getHexString();

    this.board.polyominoList.traverse((child) => {
      if (child instanceof Polyomino) {
        // 跳过白色积木和自己
        if (child.isQuestion) {
          return;
        }

        // 检查积木颜色是否相同
        let hasSameColor = false;
        child.traverse((meshChild) => {
          if (meshChild instanceof Mesh) {
            const material = meshChild.material as MeshBasicMaterial;
            if (material.color.getHexString() === targetColorHex) {
              hasSameColor = true;
            }
          }
        });

        if (!hasSameColor) {
          return;
        }

        // 检查积木是否与目标方块相邻
        const isAdjacent = child.cubeList.some((c) => {
          return directions.some((dir) => {
            return (
              c.position.x === targetPos.x + dir.dx &&
              c.position.y === targetPos.y + dir.dy &&
              c.position.z === targetPos.z + dir.dz
            );
          });
        });

        if (isAdjacent) {
          foundPolyominoes.push(child);
        }
      }
    });

    return foundPolyominoes;
  }
}
