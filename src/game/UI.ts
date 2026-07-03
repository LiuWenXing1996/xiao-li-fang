import mitt from "mitt";
import {
  Camera,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  InteractiveObject3D,
  type MeshClickEvent,
} from "./InteractiveObject3D";
export const UIEvents = {
  CLICK: "CLICK",
};
export default class UI extends InteractiveObject3D {
  private emitter = mitt();
  offscreenCanvas: HTMLCanvasElement;
  private camera: Camera | null = null;
  uiTexture: CanvasTexture<HTMLCanvasElement>;
  private offset = new Vector3(0, 0, -5);
  constructor() {
    super();
    //创建并初始化离屏 Canvas UI
    // TODO:将 DOM 操作封装下，方便 Wrapper
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = 512;
    this.offscreenCanvas.height = 512;
    const uiTexture = new CanvasTexture(this.offscreenCanvas);
    const uiMaterial = new SpriteMaterial({
      map: uiTexture,
      transparent: true,
    });
    const uiSprite = new Sprite(uiMaterial);
    uiSprite.position.set(0, 0, 0);
    uiSprite.scale.set(4, 4, 1);
    // const uiGeometry = new PlaneGeometry(2, 2);
    // const uiMesh: Mesh<PlaneGeometry, MeshBasicMaterial> = new Mesh(
    //   uiGeometry,
    //   uiMaterial,
    // );
    this.uiTexture = uiTexture;
    this.add(uiSprite);
  }
  setupClickHandler(): void {}
  drawUI(text: string, color: string): void {
    const context = this.offscreenCanvas.getContext("2d");
    if (!context) {
      throw new Error("无法获取 Canvas 2D 上下文");
    }
    const width = context.canvas.width;
    const height = context.canvas.height;

    // 清空画布
    context.clearRect(0, 0, width, height);

    // 绘制背景矩形
    context.fillStyle = "rgba(20, 20, 20, 0.85)";
    context.fillRect(0, 0, width, height);

    // 绘制边框
    context.strokeStyle = color;
    context.lineWidth = 10;
    context.strokeRect(5, 5, width - 10, height - 10);

    // 绘制文本
    context.fillStyle = "#ffffff";
    context.font = "bold 80px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2);
    this.uiTexture.needsUpdate = true;
  }
  bindCamera(camera: Camera): void {
    this.camera = camera;
  }

  setOffset(distance: number): void {
    this.offset.z = -distance;
  }
}
