import { PerspectiveCamera, WebGLRenderer } from "three";
import { SceneBase } from "./SceneBase";
import { GlobalConfig } from "./GlobalConfig";

// 定义场景类构造函数的类型签名
type SceneConstructor = new (renderer: WebGLRenderer) => SceneBase;

export class StageManager {
  renderer: WebGLRenderer;
  scenes: Record<string, SceneBase> = {};
  currentScene: SceneBase | null = null;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
  }

  // 注册场景
  register(key: string, SceneClass: SceneConstructor): void {
    const instance = new SceneClass(this.renderer);
    instance.init();
    this.scenes[key] = instance;
  }

  // 切换场景
  switchScene(key: string): void {
    const targetScene = this.scenes[key];
    if (!targetScene) {
      console.warn(`Scene with key "${key}" not found.`);
      return;
    }

    if (this.currentScene) {
      this.currentScene.deactivate();
    }

    this.currentScene = targetScene;
    this.currentScene.activate();
  }
  resizeRendererToDisplaySize(renderer: WebGLRenderer) {
    const canvas = renderer.domElement;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const width = Math.floor(canvas.clientWidth * pixelRatio);
    const height = Math.floor(canvas.clientHeight * pixelRatio);
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // 心跳驱动渲染
  tick(delta: number): void {
    if (this.currentScene && this.currentScene.camera) {
      if (this.resizeRendererToDisplaySize(this.renderer)) {
        if (this.currentScene.camera instanceof PerspectiveCamera) {
          this.currentScene.camera.aspect = GlobalConfig.targetAspect;
          this.currentScene.camera.updateProjectionMatrix();
        }
      }
      this.currentScene.update(delta);
      this.renderer.render(this.currentScene, this.currentScene.camera);
    }
  }
  getScene(key: string): SceneBase | null {
    return this.scenes[key] || null;
  }
}
