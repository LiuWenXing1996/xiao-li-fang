import { Raycaster, Vector2, Camera, Scene, Object3D } from "three";
import {
  InteractiveObject3D,
  type MeshClickEvent,
} from "./InteractiveObject3D";

export class RaycastManager {
  private raycaster: Raycaster = new Raycaster();
  private mouse: Vector2 = new Vector2();
  private camera: Camera;
  private scene: Scene;
  private domElement: HTMLCanvasElement;

  private startX = 0;
  private startY = 0;

  constructor(scene: Scene, camera: Camera, domElement: HTMLCanvasElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.initEvents();
  }

  private initEvents(): void {
    this.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.domElement.addEventListener("pointerup", this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.startX = event.clientX;
    this.startY = event.clientY;
  };

  private onPointerUp = (event: PointerEvent): void => {
    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);

    // 防误触：移动距离超过 4 像素判定为摄像机拖拽
    if (deltaX > 4 || deltaY > 4) {
      return;
    }

    this.executeRaycast(event);
  };

  private executeRaycast(event: PointerEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    );

    for (const hit of intersects) {
      let target: Object3D | null = hit.object;
      let shouldStopPropagation = false;

      const clickEvent: MeshClickEvent = { hit, pointerEvent: event };

      // 模拟事件冒泡
      while (target) {
        // 【关键类型守卫】：精准判断当前节点是否是可交互的类实例
        if (target instanceof InteractiveObject3D) {
          let hasInterceptor = false;

          for (const callback of target._clickListeners) {
            const result = callback(clickEvent);
            if (result === true) {
              hasInterceptor = true;
            }
          }

          // 如果被拦截，阻止继续向上面的父级冒泡
          if (hasInterceptor) {
            shouldStopPropagation = true;
            break;
          }
        }

        target = target.parent;
      }

      // 如果当前模型链条拦截了事件，射线在此处中止，不再穿透到身后的其他模型
      if (shouldStopPropagation) {
        break;
      }
    }
  }

  public dispose(): void {
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.domElement.removeEventListener("pointerup", this.onPointerUp);
  }
}
