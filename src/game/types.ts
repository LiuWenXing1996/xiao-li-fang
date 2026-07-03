import type { Intersection } from "three";

export type Nullable<T> = T | null | undefined;

export interface GameObjectEvent {
  hit?: Intersection; // 3D 空间碰撞数据（点击或拖拽开始时存在）
  pointerEvent: PointerEvent; // 原生浏览器指针事件（可读取 pointerId, pressure 等）
  deltaX?: number; // 拖拽滑动特有：横向移动像素绝对距离
  deltaY?: number; // 拖拽滑动特有：纵向移动像素绝对距离
}

// 统一的回调函数类型
export type GameObjectCallback = (event: GameObjectEvent) => boolean | void;
