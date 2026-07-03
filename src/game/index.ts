import { WebGLRenderer } from "three";
import UI from "./UI";
import MenuScene from "./scenes/MenuScene";
import GameScene from "./scenes/GameScene";
import { StageManager } from "./StageManager";

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
    this.stageManager.register("game", GameScene);
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
