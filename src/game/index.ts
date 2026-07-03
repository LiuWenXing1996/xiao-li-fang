// TODO:有闯关模式和无限模式，还有自定义地图模式
// TODO:地图有种子，可以根据种子找到对应的地图
// TODO:无限模式就没有地图了吧，不然也太多种子了
// TODO:奖励：用户每次通关都给星星，星星可以买道具和皮肤
// TODO:上线是至少 3 套皮肤，
// TODO:至少 50 关
// TODO:道具有炸弹、涂色
import { WebGLRenderer } from "three";
import UI from "./UI";

import StageManager from "./StageManager";
import { MainScene } from "./scenes/main/MainScene";
import MenuScene from "./scenes/menu/MenuScene";
export default class Game {
  renderer: WebGLRenderer;
  private isPaused: boolean = false;
  score: number = 0;
  scoreUI: UI = new UI();
  stageManager: StageManager;

  constructor(canvas: HTMLCanvasElement) {
    const renderer = new WebGLRenderer({ antialias: true, canvas });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.stageManager = new StageManager(renderer);
    this.stageManager.register("game", MainScene);
    this.stageManager.register("menu", MenuScene);
    const menuScene = this.stageManager.getScene("menu") as MenuScene;
    menuScene.onStartGame(() => {
      this.stageManager.switchScene("game");
    });
    this.stageManager.switchScene("menu");
    this.renderer = renderer;
    renderer.setAnimationLoop(this.animate.bind(this));
  }

  animate(time: number): void {
    this.stageManager.tick(time);

    // if (!this.isPaused) {
    //   this.update(time);
    //   this.scoreUI.update();
    // }

    // this.renderer.render(this.currentScene, this.camera);
  }

  update(time: number): void {}

  start() {}
  pause() {
    this.isPaused = true;
  }
  resume() {
    this.isPaused = false;
  }
  isGamePaused(): boolean {
    return this.isPaused;
  }
}
