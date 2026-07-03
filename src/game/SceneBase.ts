import { Scene, Camera, WebGLRenderer } from "three";

class SceneWithGameObject3D extends Scene {}

export abstract class SceneBase<
  T extends Camera = Camera,
> extends SceneWithGameObject3D {
  _camera: T | null = null;
  isActive: boolean = false;
  renderer: WebGLRenderer;

  constructor(renderer: WebGLRenderer) {
    super();
    this.renderer = renderer;
    this._camera = this.initCamera();
  }
  get camera() {
    return this._camera as T;
  }
  get canvas() {
    return this.renderer.domElement;
  }
  // 初始化相机
  abstract initCamera(): T;
  // 初始化逻辑
  abstract init(): void;
  // 每一帧的更新逻辑
  abstract update(delta: number): void;
  // 激活场景
  public activate(): void {
    this.isActive = true;
  }

  // 停用场景
  public deactivate(): void {
    this.isActive = false;
  }
}
