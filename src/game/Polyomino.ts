import {
  Object3D,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  Color,
} from "three";
import PolyominoCube from "./PolyominoCube";

export interface PolyominoConfig {
  cubes: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    color: string;
    isQuestion?: boolean;
  }[];
  color: string;
  isQuestion?: boolean;
}

export default class Polyomino extends Object3D {
  cubeList: PolyominoCube[] = [];
  private isSelected: boolean = false;
  private highlightedEdges: Object3D[] = [];
  private originalColors: Color[] = [];
  public isQuestion: boolean = false; // 是否为问号积木

  constructor(config: PolyominoConfig) {
    super();
    this.cubeList = [];
    const { cubes, color, isQuestion = false } = config;
    const baseColor = new Color(color);

    this.isQuestion = isQuestion; // 设置问号积木标记

    for (const block of cubes) {
      const {
        position,
        color: blockColor,
        isQuestion: cubeIsQuestion = false,
      } = block;
      const { x, y, z } = position;
      const cube = new PolyominoCube({
        boxColor: blockColor,
        isQuestion: cubeIsQuestion,
      });
      cube.position.set(x, y, z);
      this.add(cube);
      this.cubeList.push(cube);
      this.originalColors.push(baseColor.clone());
    }
  }

  setSelected(selected: boolean): void {
    // 如果是问号积木，不能被选中
    if (this.isQuestion) return;

    this.isSelected = selected;

    if (selected) {
      this.highlightCubes(true);
    } else {
      this.highlightCubes(false);
    }
  }

  getSelected(): boolean {
    return this.isSelected;
  }

  canBeSelected(): boolean {
    // 问号积木不能被选中
    return !this.isQuestion;
  }

  private highlightCubes(highlight: boolean): void {
    this.highlightedEdges.forEach((edge) => {
      this.remove(edge);
      edge.traverse((child) => {
        if (child instanceof LineSegments) {
          child.geometry.dispose();
          (child.material as LineBasicMaterial).dispose();
        }
      });
    });
    this.highlightedEdges = [];

    if (highlight) {
      this.cubeList.forEach((cube) => {
        const edgeContainer = new Object3D();

        const outerGeo = new BoxGeometry(1.06, 1.06, 1.06);
        const outerMat = new LineBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.8,
        });
        const outerEdges = new LineSegments(
          new EdgesGeometry(outerGeo),
          outerMat,
        );
        edgeContainer.add(outerEdges);

        const midGeo = new BoxGeometry(1.04, 1.04, 1.04);
        const midMat = new LineBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.9,
        });
        const midEdges = new LineSegments(new EdgesGeometry(midGeo), midMat);
        edgeContainer.add(midEdges);

        const innerGeo = new BoxGeometry(1.02, 1.02, 1.02);
        const innerMat = new LineBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 1,
        });
        const innerEdges = new LineSegments(
          new EdgesGeometry(innerGeo),
          innerMat,
        );
        edgeContainer.add(innerEdges);

        edgeContainer.position.copy(cube.position);

        this.add(edgeContainer);
        this.highlightedEdges.push(edgeContainer);

        cube.traverse((child) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshBasicMaterial;
            const brightenedColor = this.originalColors[0]
              .clone()
              .multiplyScalar(1.4);
            material.color.copy(brightenedColor);
          }
        });
      });
    } else {
      this.cubeList.forEach((cube) => {
        cube.traverse((child) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshBasicMaterial;
            material.color.copy(this.originalColors[0]);
          }
        });
      });
    }
  }
  // 添加移除方块的方法
  removeCube(cube: PolyominoCube): void {
    const index = this.cubeList.indexOf(cube);
    if (index !== -1) {
      this.cubeList.splice(index, 1);
      this.remove(cube);
    }

    // 如果积木没有方块了，从场景中移除
    if (this.cubeList.length === 0) {
      this.parent?.remove(this);
    }
  }
}
