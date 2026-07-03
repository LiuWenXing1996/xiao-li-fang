import { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { SceneBase } from "../SceneBase";

export default class MenuScene extends SceneBase<PerspectiveCamera> {
  private targetAspect: number = 9 / 16;
  initCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(45, this.targetAspect, 0.1, 3000);
    camera.position.set(25, 25, 25);
    camera.lookAt(0, 0, 0);
    return camera;
  }
  init(): void {}
  update(delta: number): void {}
  constructor(renderer: WebGLRenderer) {
    super(renderer);
  }
}
