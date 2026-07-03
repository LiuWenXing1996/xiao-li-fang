import { Object3D, Mesh, Material } from "three";
import {
  GameEvent,
  type BubbleEventName,
  type BubbleEventRegistry,
  type GameObjectCallback,
  type IGameObjectEventMethods,
} from "./types";

/**
 * ⚡ 高性能全局每帧更新注册表
 * ───
 * 废除耗能的 scene.traverse 深度遍历。利用哈希 Set 结构保持 O(1) 级的执行效率。
 * 物体在挂载/卸载时自动向此表注册或注销，主循环只需遍历此扁平队列。
 */
export class UpdateRegistry {
  private static activeObjects: Set<GameObject3D> = new Set();

  public static register(obj: GameObject3D): void {
    this.activeObjects.add(obj);
  }
  public static unregister(obj: GameObject3D): void {
    this.activeObjects.delete(obj);
  }

  /** 驱动全项目所有活跃 3D 对象的 Tick 循环 */
  public static tick(deltaTime: number): void {
    for (const obj of this.activeObjects) {
      obj.update(deltaTime);
    }
  }
  public static clear(): void {
    this.activeObjects.clear();
  }
  /** 向外界暴露当前所有活着的 GameObject3D 集合（只读） */
  public static getObjects(): Set<GameObject3D> {
    return this.activeObjects;
  }
}

/**
 * 🧱 工业级三维游戏/业务实体基类
 */
export class GameObject3D extends Object3D implements IGameObjectEventMethods {
  /** 强类型标签系统：用于场景中大规模物体的快速检索、分类和快速过滤 */
  public readonly tags: Set<string> = new Set();

  /** 内部射线交互控制开关，设为 false 时射线直接穿透当前物体 */
  private _isInteractable: boolean = true;

  /** 标记异步网络资产（如 GLTF）是否已经加载并组装完毕 */
  private _isLoaded: boolean = false;

  /** 全项目唯一、以强类型事件名为 Key 的多路公共发布订阅存储字典 */
  public readonly _eventPipeline: Map<BubbleEventName, Function[]> = new Map();

  constructor() {
    super();
    this.onAwake(); // 1. 【生命周期：苏醒】
    this.initLifecycleWatcher(); // 绑定场景树 added/removed 原生监听
    this.onStart(); // 2. 【生命周期：就绪】
  }

  /** 订阅强类型业务/手势事件：第二个参数的回调数据结构会根据第一个参数自动完美推断 */
  public addClickListenerCustom<T extends BubbleEventName>(
    eventName: T,
    callback: GameObjectCallback<T>,
  ): void {
    if (!this._eventPipeline.has(eventName))
      this._eventPipeline.set(eventName, []);
    const listeners = this._eventPipeline.get(eventName)!;
    if (!listeners.includes(callback)) listeners.push(callback);
  }

  /** 取消事件订阅 */
  public removeClickListenerCustom<T extends BubbleEventName>(
    eventName: T,
    callback: GameObjectCallback<T>,
  ): void {
    const listeners = this._eventPipeline.get(eventName);
    if (!listeners) return;
    const index = listeners.indexOf(callback);
    if (index !== -1) listeners.splice(index, 1);
  }

  /**
   * 强类型通用链式冒泡派发器，频段隔离版链式事件分发器
   * 点中子节点时沿着 parent 树一路向上冒泡传递，回调函数中 `return true` 可彻底截断事件
   */
  public emitBubbleEvent<T extends BubbleEventName>(
    eventName: T,
    eventData: BubbleEventRegistry[T],
  ): void {
    // ==========================================
    // 🛡️ 通道一：如果进来的是【点击空气通知】（GameEvent.ClickEmpty）
    // ==========================================
    if (eventName === GameEvent.ClickEmpty) {
      const listeners = this._eventPipeline.get(eventName);
      if (listeners && listeners.length > 0) {
        for (const cb of listeners) {
          cb(eventData); // 1. 直接触发当前大脑的空气响应业务
        }
      }
      // 2. 核心拦截：直接原地无情 return，绝对不走下面的 parent 冒泡死循环！
      return;
    }

    // ==========================================
    // 🎯 通道二：如果是【Click/Drag等靶向物理手势】（走标准自下而上冒泡）
    // ==========================================
    let current: any = this;

    while (current) {
      if (!current._eventPipeline) break;

      // 提取当前节点对应的事件队列
      const listeners = current._eventPipeline.get(eventName);

      if (listeners && listeners.length > 0) {
        let isIntercepted = false;

        for (const cb of listeners) {
          // 执行物理手势回调
          if (cb(eventData) === true) {
            isIntercepted = true;
          }
        }

        // 只要任何一层返回了 true，拦截信号，终止继续向上冒泡
        if (isIntercepted) break;
      }

      current = current.parent; // 顺着场景树向上冒泡
    }
  }

  /**
   * 核心级联机制：将 Three.js 原生树变动升级为级联多米诺生命周期网络
   */
  private initLifecycleWatcher(): void {
    // 监听挂载（added）：物体被 add 进主场景或容器时触发
    this.addEventListener("added", () => {
      UpdateRegistry.register(this);
      this.onMount(); // 3. 【生命周期：挂载成功】

      // 级联挂载：如果是作为一个复合大容器被加入场景，递归激活肚子里所有小弟的 update
      this.traverse((child) => {
        if (child instanceof GameObject3D && child !== this)
          UpdateRegistry.register(child);
      });
    });

    // 监听卸载（removed）：物体或其任意上级父代执行 remove 时自动层层向下波纹广播
    this.addEventListener("removed", () => {
      UpdateRegistry.unregister(this);
      this.onUnmount(); // 5. 【生命周期：卸载清理】

      // 💡 级联卸载广播：爷爷赶走爸爸，爸爸会尽责地遍历并强行通知所有子孙红色方块执行 onUnmount 垃圾打扫
      this.traverse((child) => {
        if (child instanceof GameObject3D && child !== this) {
          child.onUnmount(); // 关闭子组件内部的业务定时器/解绑通知
          UpdateRegistry.unregister(child); // 从每帧驱动列表中拿下，不浪费一点 CPU 算力
        }
      });
    });
  }

  /**
   * 资产异步加载加载网关（完美消灭网络异步引起的 undefined 报错）
   * @param loadTask 自自定义加载函数（内部通常封装 GLTFLoader.loadAsync）
   */
  public async loadAsset(loadTask: () => Promise<Object3D>): Promise<void> {
    try {
      const model = await loadTask();
      this.add(model); // 将下载好的外部模型拼装进当前空的容器壳子里
      this._isLoaded = true;
      this.onLoaded(); // ⭐️ 【生命周期：外部网络资产下载并模型组装完毕】
    } catch (error) {
      console.error(`[GameObject3D] 外部资产加载或组装失败:`, error);
    }
  }

  // ===================================================================================
  // 7 大核心生命周期钩子（LifeCycle Hooks）- 供自定义子类业务按需去重写（override）
  // ===================================================================================

  /** 1.【苏醒】：对象被 `new` 出来的第一瞬间触发。适合初始化血量、标志符等纯内存 JS/TS 状态变量。 */
  protected onAwake(): void {}

  /** 2.【就绪】：构造函数即将结束的瞬间触发。此时内存架构已就绪，最适合组装本地固定 Mesh 几何体。 */
  protected onStart(): void {}

  /** 3.【挂载】：物体进入 3D 渲染场景的瞬间触发。适合在这里启动 AI 状态机、轮询定时器或订阅全局 EventBus 通知。 */
  protected onMount(): void {}

  /** ⭐️【资产就绪】：异步模型（如 GLTF）完全下载并 add 进当前壳子后触发。后续一切需要依赖外部骨骼/顶点的操作必须写在这里。 */
  protected onLoaded(): void {}

  /** 4.【每帧更新】：由全局扁平注册表死循环驱动，配合 deltaTime 实现与硬件帧率无关的平滑三维动画（如雷达旋转）。 */
  public update(deltaTime: number): void {}

  /** 5.【卸载】：物体被移出 3D 世界瞬间触发。主要职责是【垃圾清理】，必须在此处 clearInterval 定时器或解绑消息。 */
  protected onUnmount(): void {}

  /** 6.【临终遗言】：外界主动调用 .destroy() 后的最开头瞬间触发。适合派发业务通知（如死后给玩家加分）或派发爆炸特效。 */
  protected onDestroying(): void {}

  /** 统一的高级显隐控制，显隐时同步关闭/开启射线交互，防止出现“隐形空气墙”挡住身后点击的 Bug */
  public setVisibility(
    visible: boolean,
    disableInteraction: boolean = true,
  ): void {
    this.visible = visible;
    if (disableInteraction) this._isInteractable = visible;
  }

  /** 供外界 RaycastManager 检测时的复合验证：必须未隐藏，且（资产加载完毕 或 拥有本地网格） */
  public get isInteractable(): boolean {
    return this._isInteractable && (this._isLoaded || this.children.length > 0);
  }

  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * ☠️ 终极摧毁（具备强力级联向下自毁机制）
   * 当你需要让一个复合多层级的宏大物体永久消失时，直接调用此方法，底层会自动将所有子孙彻底打扫干净。
   */
  public destroy(): void {
    this.onDestroying(); // 1. 先触发自己的临终钩子

    // 2. 💡 级联向下自毁：先把肚子里所有可交互的子孙组件（如红色方块）存入列表
    const childrenToDestroy: GameObject3D[] = [];
    this.traverse((child) => {
      if (child instanceof GameObject3D && child !== this)
        childrenToDestroy.push(child);
    });
    // 命令所有红色子方块也端端正正地执行它们的 destroy 流程（红方块会自动执行各自的临终送分和显存粉碎）
    childrenToDestroy.forEach((child) => child.destroy());

    this.onUnmount();
    this.removeFromParent(); // 3. 儿子主动离家出走，会稳定触发上面的原生 removed 监听
    this._eventPipeline.clear(); // 4. 排空当前对象身上的所有发布订阅管道，防止闭包内存泄漏

    // 5. 深度递归遍历底层所有网格，将 Geometry 顶点和 Material 贴图调用 dispose 彻底从 GPU 显存抹除
    this.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: Material) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
    this.tags.clear();
  }
}
