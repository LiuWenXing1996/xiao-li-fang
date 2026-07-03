import type { Intersection } from "three";

export type Nullable<T> = T | null | undefined;

/**
 * 💡 1. 全局唯一的事件名常量网关（事件门面）
 * ───
 * 彻底抹除全项目所有业务层中的单引号魔术字符串。
 * 业务编写、注册、分发时全面拥抱纯正的点语法，支持 IDE 一键 F2 安全重构和重命名。
 */
export const GameEvent = {
  /** 鼠标或手指【原地轻点】事件 */
  Click: "click",
  /** 鼠标或手指【点击空白处】事件 */
  ClickEmpty: "clickEmpty",
  /** 鼠标或手指【双击】事件 */
  DblClick: "dblclick",
  /** 鼠标或手指【长按超过 800ms】事件 */
  LongPress: "longPress",
  /** 拖拽滑动【开始的瞬间】 */
  DragStart: "dragStart",
  /** 拖拽滑动【进行中】 */
  DragMove: "dragMove",
  /** 拖拽滑动【手指抬起结束时】 */
  DragEnd: "dragEnd",
  /** 业务：方块消亡触发的关卡计分事件 */
  AddScore: "addScore",
} as const; // as const 关键：把属性全部锁死为只读的字面量类型

/**
 * 2. 基础事件数据骨架
 * 确保所有 3D 指针交互事件都至少携带原生的浏览器指针数据，便于子类获取压感、多指 ID 等。
 */
export interface BasePointerEvent {
  /** 原生浏览器现代指针事件 (包含 touch, mouse, pen 三端合一数据) */
  pointerEvent: PointerEvent;
}

/**
 * 3. 核心事件参数结构映射表字典
 * 将每个事件名与它【专属的数据结构】死死绑定在一起
 */
export interface BubbleEventRegistry {
  click: BasePointerEvent & { hit: Intersection };
  clickEmpty: BasePointerEvent;
  dblclick: BasePointerEvent & { hit: Intersection };
  longPress: BasePointerEvent & { hit: Intersection };
  dragStart: BasePointerEvent & { hit: Intersection };
  dragMove: BasePointerEvent & { deltaX: number; deltaY: number };
  dragEnd: BasePointerEvent;

  // 💡 自定义业务：计分事件携带的强类型参数
  addScore: { score: number };
}

/**
 * 4. 动态提取所有合法的事件名称字面量类型
 * 利用 keyof 自动提取字典的键，后续增加事件只需在 BubbleEventRegistry 中加一行，此处自动更新！
 */
export type BubbleEventName = (typeof GameEvent)[keyof typeof GameEvent];

// 统一的回调函数泛型签名
export type GameObjectCallback<T extends BubbleEventName> = (
  event: BubbleEventRegistry[T],
) => boolean | void;

/**
 * 5. 💡 强类型方法存取契约
 * 这个接口是专门给 GameObject3D 的成员方法量身定制的。
 * 它利用了 TS 的条件方法签名（Method Signatures），能够让 VS Code 在编译期
 * 100% 准确地拦截并推断出对应的参数，绝不发生“退化为 any”的惨剧。
 */
export interface IGameObjectEventMethods {
  addClickListenerCustom<T extends BubbleEventName>(
    eventName: T,
    callback: GameObjectCallback<T>,
  ): void;

  removeClickListenerCustom<T extends BubbleEventName>(
    eventName: T,
    callback: GameObjectCallback<T>,
  ): void;

  emitBubbleEvent<T extends BubbleEventName>(
    eventName: T,
    eventData: BubbleEventRegistry[T],
  ): void;
}
