import {
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { SceneBase } from "../SceneBase";
import { GlobalConfig } from "../GlobalConfig";
import UI from "../UI";
import mitt from "mitt";

export const MenuSceneEvents = {
  START_GAME: "START_GAME",
};

export default class MenuScene extends SceneBase<PerspectiveCamera> {
  startUi: UI;
  private emitter = mitt();
  constructor(renderer: WebGLRenderer) {
    super(renderer);
    this.startUi = new UI();
    this.add(this.startUi);
    this.startUi.drawUI("开始游戏", "#ffffff");
  }
  initCamera(): PerspectiveCamera {
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
  init() {
    this.startUi.bindCamera(this.camera);
    this.setupClickHandler();
  }
  update(delta: number): void {
    this.startUi.update();
  }
  setupClickHandler(): void {
    this.canvas.addEventListener("click", (event) => {
      if (this.isClickOnStartButton(event)) {
        this.emitter.emit(MenuSceneEvents.START_GAME);
      }
    });
  }
  onStartGame(callback: () => void): void {
    this.emitter.on(MenuSceneEvents.START_GAME, callback);
  }
  isClickOnStartButton(event: MouseEvent): boolean {
    const rect = this.canvas.getBoundingClientRect();
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    // 检测是否点击了开始按钮
    const intersects = raycaster.intersectObject(this.startUi);
    return intersects.length > 0;
  }
}
