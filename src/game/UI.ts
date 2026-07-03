import {
  Camera,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from "three";

export default class UI extends Object3D {
  offscreenCanvas: HTMLCanvasElement;
  private camera: Camera | null = null;
  uiTexture: CanvasTexture<HTMLCanvasElement>;

  constructor() {
    super();
    //创建并初始化离屏 Canvas UI
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = 512;
    this.offscreenCanvas.height = 512;
    const uiTexture = new CanvasTexture(this.offscreenCanvas);
    const uiMaterial = new MeshBasicMaterial({
      map: uiTexture,
      transparent: true,
      side: DoubleSide,
    });

    const uiGeometry = new PlaneGeometry(2, 2);
    const uiMesh: Mesh<PlaneGeometry, MeshBasicMaterial> = new Mesh(
      uiGeometry,
      uiMaterial,
    );
    this.uiTexture = uiTexture;
    this.add(uiMesh);
  }
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
  // 更新位置（在渲染循环中调用）
  update(): void {
    if (!this.camera) return;

    // // 获取摄像机的位置和方向
    // const cameraPosition = this.camera.position.clone();
    // const cameraDirection = new Vector3();
    // this.camera.getWorldDirection(cameraDirection);

    // // 计算 UI 位置：摄像机位置 - 摄像机方向 × 偏移距离
    // // const uiPosition = cameraPosition.sub(
    // //   cameraDirection.multiplyScalar(this.offset.length()),
    // // );

    // // 设置 UI 位置
    // // this.position.copy(uiPosition);

    // 让 UI 面向摄像机
    this.lookAt(this.camera.position);
  }
}
