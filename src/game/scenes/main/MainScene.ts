import { Color, PerspectiveCamera, type WebGLRenderer } from "three";
import { SceneBase } from "../../SceneBase";
import { GlobalConfig } from "../../GlobalConfig";
import { MainSceneController } from "./MainSceneController";

export class MainScene extends SceneBase<PerspectiveCamera> {
  constructor(renderer: WebGLRenderer) {
    super(renderer);
    this.background = new Color(0x1a1a2e);
    this.add(new MainSceneController());
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
  init(): void {}
  update(delta: number): void {}
}
