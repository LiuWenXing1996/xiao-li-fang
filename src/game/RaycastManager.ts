import {
  Raycaster,
  Vector2,
  Camera,
  Scene,
  Object3D,
  type Intersection,
} from "three";
import { GameObject3D, UpdateRegistry } from "./GameObject3D";
import { type GameObjectEvent } from "./types";

export class RaycastManager {
  private raycaster: Raycaster = new Raycaster();
  private mouse: Vector2 = new Vector2();
  private camera: Camera;
  private scene: Scene;
  private domElement: HTMLCanvasElement;

  // 手势状态维度的私有变量
  private isPointerDown = false;
  private startX = 0;
  private startY = 0;
  private activeTarget: GameObject3D | null = null; // 当前正在交互捕获的目标

  constructor(scene: Scene, camera: Camera, domElement: HTMLCanvasElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.initEvents();
  }

  private initEvents(): void {
    this.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.domElement.addEventListener("pointermove", this.onPointerMove);
    this.domElement.addEventListener("pointerup", this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.isPointerDown = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    // 💡 优化三：启用 HTML5 指针捕获，锁定 Pointer ID
    // 即使手指/鼠标滑出 Canvas、滑出网页边界，弹起事件也绝对不会丢失
    this.domElement.setPointerCapture(event.pointerId);

    const hit = this.getIntersectObject(event);
    if (hit) {
      this.activeTarget = hit.gameObject;

      // 派发拖拽开始事件
      this.dispatchEventToPipeline(this.activeTarget, "_dragStartListeners", {
        hit: hit.intersection,
        pointerEvent: event,
      });
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isPointerDown) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // 判定鼠标发生实质性位移（超过 4 像素）
    if (this.activeTarget && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      // 派发拖拽移动中事件，将 delta 相对位移实时发送给物体组件
      this.dispatchEventToPipeline(this.activeTarget, "_dragMoveListeners", {
        pointerEvent: event,
        deltaX,
        deltaY,
      });
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;

    // 释放指针锁定
    this.domElement.releasePointerCapture(event.pointerId);

    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);

    if (this.activeTarget) {
      // 派发拖拽结束事件
      this.dispatchEventToPipeline(this.activeTarget, "_dragEndListeners", {
        pointerEvent: event,
      });

      // 防误触核心：如果手指几乎没动，判定为是一次纯粹的点击交互
      if (deltaX <= 4 && deltaY <= 4) {
        this.dispatchEventToPipeline(this.activeTarget, "_clickListeners", {
          pointerEvent: event,
        });
      }
    }

    this.activeTarget = null;
  };

  /**
   * 核心辅助：发射射线计算最前方相交的 GameObject3D
   */
  private getIntersectObject(
    event: PointerEvent,
  ): { gameObject: GameObject3D; intersection: Intersection } | null {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    );

    for (const hit of intersects) {
      let current: Object3D | null = hit.object;

      // 向上冒泡寻找最近的 GameObject3D 实体
      while (current) {
        if (current instanceof GameObject3D) {
          // 如果该对象声明了“禁用交互”或者“资产尚未加载完成”，则空气穿透，去看身后的人
          if (!current.isInteractable) {
            break;
          }
          return { gameObject: current, intersection: hit };
        }
        current = current.parent;
      }
    }
    return null;
  }

  /**
   * 核心辅助：多路发布订阅的纵向冒泡分发管道
   */
  private dispatchEventToPipeline(
    target: GameObject3D,
    pipelineKey: string,
    eventData: GameObjectEvent,
  ): void {
    let current: any = target;

    while (current) {
      const listeners = current[pipelineKey];
      if (listeners && listeners.length > 0) {
        let isIntercepted = false;

        for (const callback of listeners) {
          // 执行订阅者函数
          if (callback(eventData) === true) {
            isIntercepted = true; // 触发拦截标记
          }
        }

        // 如果在当前层级被 return true 拦截，事件切断，不再向上冒泡给父级 Group
        if (isIntercepted) {
          break;
        }
      }
      current = current.parent;
    }
  }

  /** 销毁清理 */
  public dispose(): void {
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.domElement.removeEventListener("pointerup", this.onPointerUp);
    UpdateRegistry.clear();
  }
}
