import {
  BoxGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  type ColorRepresentation,
} from "three";

export interface PolyominoCubeConfig {
  boxColor?: ColorRepresentation;
  opacity?: number;
  lineColor?: ColorRepresentation;
  isQuestion?: boolean;
}

export default class PolyominoCube extends Object3D {
  public readonly config: Readonly<PolyominoCubeConfig>;
  public isQuestionBlock: boolean = false; // 是否为问号块
  public isRevealed: boolean = false; // 是否已变色

  constructor(config?: PolyominoCubeConfig) {
    super();
    this.config = Object.freeze(config ?? {});
    const {
      boxColor = "#FFFFFF",
      lineColor = "#000000",
      opacity,
      isQuestion = false,
    } = this.config;

    this.isQuestionBlock = isQuestion;
    const displayColor = isQuestion ? "#FFFFFF" : boxColor;

    const boxGeometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({
      color: displayColor,
      transparent: opacity !== undefined,
      opacity: opacity ?? 0.9,
    });
    const mesh = new Mesh(boxGeometry, material);

    const lineSegments = new LineSegments(
      new EdgesGeometry(boxGeometry),
      new LineBasicMaterial({ color: lineColor }),
    );

    this.add(mesh);
    this.add(lineSegments);
  }

  // 改变方块颜色
  changeColor(color: ColorRepresentation): void {
    this.isQuestionBlock = false; // 不再是问号块
    this.isRevealed = true; // 标记为已变色

    this.traverse((child) => {
      if (child instanceof Mesh) {
        const material = child.material as MeshBasicMaterial;
        material.color.set(color);
      }
    });
  }
}
