import {
  Raycaster,
  Vector2,
  Camera,
  Scene,
  Object3D,
  type Intersection,
} from "three";
import { GameObject3D, UpdateRegistry } from "./GameObject3D";
import { GameEvent } from "./types";

/**
 * 🎛️ 现代多端复合手势交互与安全防丢失射线管理器
 * ───
 * 【主要职责】：
 *  1. 接管全 Canvas 的统一二维指针事件（鼠标、手机触控、压感笔），并将其转化为 3D 标准设备坐标 NDC。
 *  2. 模拟 2D 网页的事件系统，计算三维空间物理碰撞，并沿着场景树向上完成“链式事件冒泡分发”。
 *  3. 【鲁棒性卫士】：内置了高级状态守卫，完美处理因物体在拖拽途中“猝死/突发自毁”引发的 NullPointer 边界灾难。
 */
export class RaycastManager {
  private raycaster: Raycaster = new Raycaster();
  private mouse: Vector2 = new Vector2();
  private camera: Camera;
  private scene: Scene;
  private domElement: HTMLCanvasElement;

  // --------------------------------------------------
  // 核心手势状态机私有属性
  // --------------------------------------------------
  /** 标记当前屏幕是否正处于按下/触控状态 */
  private isPointerDown = false;
  /** 记录鼠标按下/手指戳下那一瞬间的初始 X 屏幕坐标 */
  private startX = 0;
  /** 记录鼠标按下/手指戳下那一瞬间的初始 Y 屏幕坐标 */
  private startY = 0;
  /** 当前正处于交互生命周期中的目标 GameObject3D 实体（如正在被拖着移动的积木） */
  private activeTarget: GameObject3D | null = null;
  /** 记录上一次成功触发“点击空白”的绝对时间戳（毫秒） */
  private lastClickEmptyTime = 0;

  constructor(scene: Scene, camera: Camera, domElement: HTMLCanvasElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.initEvents();
  }

  /**
   * 初始化事件网关：全面接管底层交互
   */
  private initEvents(): void {
    this.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.domElement.addEventListener("pointermove", this.onPointerMove);
    this.domElement.addEventListener("pointerup", this.onPointerUp);
  }

  /**
   * 🎯 【手势环节 1/3】：指针按下 (Pointer Down)
   * ───
   * 📌 【触发时机】：鼠标左键按下、或手指刚摸到手机屏幕的瞬间。
   */
  private onPointerDown = (event: PointerEvent): void => {
    this.isPointerDown = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    // 💡 【核心多端交互优化】：启用 HTML5 指针捕捉（Pointer Capture）技术锁死 Pointer ID！
    // 经典痛点：用户快速用手指或鼠标拖拽 3D 物体时，由于移动速度极快，指针脱离了网页可视范围并在浏览器外面松开了手指。
    //          当手指再次移回画面时，Canvas 由于漏掉了 pointerup 事件，会产生“物体粘在鼠标上拿不下来”的恶性 Bug。
    // 绝妙解法：强行把当前的指针 ID 锁定在 Canvas 身上。这样一来，哪怕用户的手指飞到屏幕外面、滑到浏览器外面弹起，
    //          由于 Canvas 依然是该指针的法定监听者，pointerup 事件绝对百分之百不会丢失！
    this.domElement.setPointerCapture(event.pointerId);

    // 发射射线寻找当前点中的最前排物体
    const hit = this.getIntersectObject(event);
    if (hit) {
      this.activeTarget = hit.gameObject;

      // 💡 触发拖拽开始管道：直接通过纯正的点语法网关（GameEvent.DragStart）安全派发数据
      this.activeTarget.emitBubbleEvent(GameEvent.DragStart, {
        hit: hit.intersection,
        pointerEvent: event,
      });
    }
  };

  /**
   * 🎯 【手势环节 2/3】：指针滑动 (Pointer Move)
   * ───
   * 📌 【触发时机】：鼠标按住或者手指在屏幕上持续移动时。
   */
  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isPointerDown) return;

    // 实时计算此时的指针距离刚按下时的绝对像素偏移位移量
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // 【防抖判定】：当用户手指微弱颤抖（移动不超过 4 像素）时判定为静止，
    // 只有发生实质性的大面积位移，才正式激活物体的拖拽进行中状态
    if (this.activeTarget && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      // 💡 触发拖拽移动中：实时将外部计算好的 X/Y 像素相对位移 delta 广播给物体
      this.activeTarget.emitBubbleEvent(GameEvent.DragMove, {
        pointerEvent: event,
        deltaX,
        deltaY,
      });
    }
  };

  /**
   * 🎯 【手势环节 3/3】：指针弹起/松开 (Pointer Up)
   * ───
   * 📌 【触发时机】：鼠标松开、或手指离开屏幕的瞬间。
   */
  private onPointerUp = (event: PointerEvent): void => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;

    // 指针已经弹起，任务结束，立即安全释放对当前 Pointer ID 的物理锁定
    this.domElement.releasePointerCapture(event.pointerId);

    const deltaX = Math.abs(event.clientX - this.startX);
    const deltaY = Math.abs(event.clientY - this.startY);
    // 💡 防相机误触判断：用户松开手指，且没有大幅度拖拽视角
    if (deltaX <= 4 && deltaY <= 4) {
      if (this.activeTarget) {
        // A. 点中了具体的 GameObject3D
        this.activeTarget.emitBubbleEvent(GameEvent.DragEnd, {
          pointerEvent: event,
        });
        this.activeTarget.emitBubbleEvent(GameEvent.Click, {
          pointerEvent: event,
          hit: (this.activeTarget as any)._lastHitIntersection,
        });
      } else {
        const currentTime = performance.now(); // 获取当前高精度时间戳

        // 💡 【核心防重守卫】：如果距离上一次触发点击空白的时间小于 200毫秒，
        // 说明绝对是浏览器兼容性引发的重复伪信号，直接无情 return 丢弃，绝不向下投递！
        if (currentTime - this.lastClickEmptyTime < 200) {
          return;
        }

        // 成功通过防重验证，刷新时间戳锁
        this.lastClickEmptyTime = currentTime;

        // 精准去扁平注册表里瞬移投递给你的第四层大脑
        const allActiveObjects = UpdateRegistry.getObjects();
        for (const obj of allActiveObjects) {
          if (obj._eventPipeline.has(GameEvent.ClickEmpty)) {
            obj.emitBubbleEvent(GameEvent.ClickEmpty, { pointerEvent: event });
            break; // 确保只投递给全场景中第一个注册了 ClickEmpty 的大脑
          }
        }
      }
    }
    this.activeTarget = null;
  };

  /**
   * 🔍 【核心辅助】：物理碰撞检测机制
   * ───
   * 【用途】：将 2D 屏幕坐标转换为 3D 的 NDC 坐标，发射射线计算出屏幕正中央前方第一个相交的可交互 GameObject3D。
   */
  private getIntersectObject(
    event: PointerEvent,
  ): { gameObject: GameObject3D; intersection: Intersection } | null {
    const rect = this.domElement.getBoundingClientRect();

    // 1. 标准化设备坐标 NDC 转换（固定公式，将屏幕左上角坐标映射为 3D 中心点的 [-1, 1] 轴向）
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 2. 根据当前的相机方向更新射线的源头和物理朝向
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 3. 计算所有与射线产生交叉碰撞的子网格数组（开启递归深度检测）
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true,
    );

    // 4. 从前往后（由近到远）检查碰撞单元
    for (const hit of intersects) {
      let current: Object3D | null = hit.object;

      // 💡 链式冒泡类型检查：沿着碰撞到的底层叶子 Mesh 向上寻找它的 GameObject3D 控制母体壳子
      while (current) {
        if (current instanceof GameObject3D) {
          // ⚠️ 【核心权限守卫】：
          // 如果该对象被业务层隐形了（setVisibility(false)）、或者该对象的网络 GLTF 模型还在异步下载中，
          // 它在底层的 `isInteractable` 会直接返回 false。
          // 此时，射线管理器会聪明地触发“空气穿透效果”──直接 break 掉当前链条，让子弹继续飞去检测身后的其他模型！
          if (!current.isInteractable) break;

          // 临时挂载碰撞体高精度位置数据，供后续的 Click 点击事件精准消费
          (current as any)._lastHitIntersection = hit;
          return { gameObject: current, intersection: hit };
        }
        current = current.parent;
      }
    }
    return null;
  }

  /**
   * 🚪 销毁清理生命周期
   * ───
   * 【用途】：当整个 3D 页面组件被卸载切换、或者关卡重置时，必须由外部主动调用此方法。
   *          彻底解除网页 Canvas 上的全局监听器，防止发生严重的浏览器核心内存泄漏。
   */
  public dispose(): void {
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.domElement.removeEventListener("pointerup", this.onPointerUp);

    // 清空全局扁平更新表
    UpdateRegistry.clear();
  }
}
