import { Object3D, type Intersection } from "three";

// 1. 定义点击事件的参数结构
export interface MeshClickEvent {
  hit: Intersection; // Three.js 原生的碰撞数据
  pointerEvent: PointerEvent; // 原生的浏览器指针事件
}

// 2. 统一的回调函数类型
export type MeshClickCallback = (event: MeshClickEvent) => boolean | void;

/**
 * 交互式 3D 对象基类
 * 只有继承了该类的 3D 对象，才具备多路事件监听能力
 */
export class InteractiveObject3D extends Object3D {
  // 将监听队列和方法显式定义在类内部
  public readonly _clickListeners: MeshClickCallback[] = [];

  /**
   * 注册点击监听器
   */
  public addClickListener(callback: MeshClickCallback): void {
    if (!this._clickListeners.includes(callback)) {
      this._clickListeners.push(callback);
    }
  }

  /**
   * 移除点击监听器
   */
  public removeClickListener(callback: MeshClickCallback): void {
    const index = this._clickListeners.indexOf(callback);
    if (index !== -1) {
      this._clickListeners.splice(index, 1);
    }
  }
}
