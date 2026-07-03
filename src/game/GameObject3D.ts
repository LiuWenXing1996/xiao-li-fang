import { Object3D, Mesh, Material } from "three";
import { type GameObjectCallback } from "./types";

/**
 * ⚡ 高性能全局每帧更新注册表
 * 采用扁平化的 Set 结构，查询和遍历效率为 O(1)
 */
export class UpdateRegistry {
  private static activeObjects: Set<GameObject3D> = new Set();

  public static register(obj: GameObject3D): void {
    this.activeObjects.add(obj);
  }

  public static unregister(obj: GameObject3D): void {
    this.activeObjects.delete(obj);
  }

  /**
   * 驱动全项目所有活跃的 GameObject3D 的核心 Tick
   */
  public static tick(deltaTime: number): void {
    for (const obj of this.activeObjects) {
      obj.update(deltaTime);
    }
  }

  public static clear(): void {
    this.activeObjects.clear();
  }
}

/**
 * 🧱 工业级三维游戏/业务实体基类
 */
export class GameObject3D extends Object3D {
  /**
   * 强类型标签系统：用于场景中大规模物体的快速检索、分类和射线快速过滤
   * 例如：tags.add('enemy') 或 tags.add('clickable')
   */
  public readonly tags: Set<string> = new Set();

  /** 内部射线交互控制开关 */
  private _isInteractable: boolean = true;

  /** 异步网络资产（如 GLTF）是否加载组装完成的标记 */
  private _isLoaded: boolean = false;

  // 4 大高级复合手势的多路发布订阅管道（由外部 RaycastManager 直接调用和分发）
  public readonly _clickListeners: GameObjectCallback[] = [];
  public readonly _dragStartListeners: GameObjectCallback[] = [];
  public readonly _dragMoveListeners: GameObjectCallback[] = [];
  public readonly _dragEndListeners: GameObjectCallback[] = [];

  constructor() {
    super();

    // 1. 【触发苏醒周期】：此时内存刚刚分配
    this.onAwake();

    // 绑定原生场景树的原生 added/removed 监听器
    this.initLifecycleWatcher();

    // 2. 【触发启动就绪周期】：构造函数的最后一步
    this.onStart();
  }

  /** 注册点击监听器 */
  public addClickListener(cb: GameObjectCallback): void {
    this._clickListeners.push(cb);
  }
  /** 注册拖拽开始监听器 */
  public addDragStartListener(cb: GameObjectCallback): void {
    this._dragStartListeners.push(cb);
  }
  /** 注册拖拽中/滑动监听器 */
  public addDragMoveListener(cb: GameObjectCallback): void {
    this._dragMoveListeners.push(cb);
  }
  /** 注册拖拽结束监听器 */
  public addDragEndListener(cb: GameObjectCallback): void {
    this._dragEndListeners.push(cb);
  }

  /**
   * 监听 Three.js 底层原生的场景树变动事件
   * 此处将原生的 'added/removed' 转换为上层语义化的 'onMount/onUnmount' 生命周期函数
   */
  private initLifecycleWatcher(): void {
    this.addEventListener("added", () => {
      // 💡 核心优化点：物体一旦进入 3D 渲染世界，立刻自动向全局更新注册表报到
      UpdateRegistry.register(this);

      // 3. 【触发挂载生命周期】
      this.onMount();
    });

    this.addEventListener("removed", () => {
      // 💡 核心优化点：物体一旦离开 3D 世界，立刻从每帧更新列表中注销，绝对不浪费 1 毫秒的 CPU 算力
      UpdateRegistry.unregister(this);

      // 5. 【触发卸载生命周期】
      this.onUnmount();
    });
  }

  /**
   * 🎛️ 资产异步加载器抽象骨架（解决 WebGL 的网络异步时序 Bug）
   * @param loadTask 开发者在子类传入的自定义异步加载任务（通常内部是调用 GLTFLoader）
   */
  public async loadAsset(loadTask: () => Promise<Object3D>): Promise<void> {
    try {
      const model = await loadTask();
      this.add(model); // 将美术模型组装到当前这个空的容器壳子里
      this._isLoaded = true;

      // ⭐️ 【触发资产就绪生命周期】
      this.onLoaded();
    } catch (error) {
      console.error(
        `[GameObject3D] 异步资产加载或组装失败，请检查网络路径或模型格式:`,
        error,
      );
    }
  }

  // ===================================================================================
  // 核心生命周期钩子（LifeCycle Hooks）- 子类根据具体业务需要选择性地去重写（override）
  // ===================================================================================

  /**
   * 1️⃣ 【生命周期：苏醒 (Awake)】
   * ───
   * 📌 【触发时机】：当这个对象被 `new` 出来的第一瞬间（构造函数的最开头）。
   * 🎯 【设计目的】：用来做最纯粹的、内存维度的基本 JS/TS 数据状态变量的初始化。
   * 🛠️ 【经典场景】：初始化纯数字的血量（this.hp = 100）、创建状态标志符（this.isActive = true）。
   * ⚠️ 【避坑指南】：此时子网格 Mesh 尚未搭建，绝对不要在里面尝试通过 `this.children[0]` 读取任何 3D 元素。
   */
  protected onAwake(): void {}

  /**
   * 2️⃣ 【生命周期：启动就绪 (Start)】
   * ───
   * 📌 【触发时机】：类的构造函数（constructor）执行到最后一步、即将结束的瞬间。
   * 🎯 【设计目的】：代表 3D 物体在内存和代码架构层面已经完全搭建并初始化就绪。
   * 🛠️ 【经典场景】：在里面直接写死的网格组装（this.add(new Mesh(...))）、打上基础标签（tags.add('ui')）。
   * ⚠️ 【避坑指南】：此时物体【仅仅是在内存中建好了】，它还没有被 `scene.add()` 挂载到 3D 画面里。
   *               所以千万不要在这里做任何需要依赖“场景尺寸/主相机/其他建筑”的 3D 空间位置计算。
   */
  protected onStart(): void {}

  /**
   * 3️⃣ 【生命周期：挂载 (Mount)】
   * ───
   * 📌 【触发时机】：当执行了 `scene.add(this)`，物体真正“空降”进入 3D 渲染世界的这一瞬间。
   * 🎯 【设计目的】：启动该物体专属的“生存状态”和对外连接。
   * 🛠️ 【经典场景】：
   *    1. 启动它的 AI 决策状态机或轮询定时器（this.timer = setInterval(...)）。
   *    2. 订阅全局的发布订阅通知事件（EventBus.on('theme-change', ...)，让大楼跟着变颜色）。
   *    3. 播放一段从地下钻出来的“出生/淡入动画”。
   * ⚠️ 【避坑指南】：这里启动的所有异步逻辑（如定时器、全局消息订阅、WebSocket），必须在 `onUnmount` 留下对应的解绑。
   */
  protected onMount(): void {}

  /**
   * ⭐️ 【生命周期：异步资产加载完成 (Loaded)】
   * ───
   * 📌 【触发时机】：当外部调用了 `loadAsset`，网络端的 .gltf/.glb 模型文件下载完毕，并被成功 add 到容器内的瞬间。
   * 🎯 【设计目的】：作为异步资产加载的专属分水岭，保证后续的 3D 操作拥有绝对安全的 3D 子节点引用。
   * 🛠️ 【经典场景】：提取外部模型文件里的骨骼动画组件（AnimationMixer）、批量改写美术导出的模型网格材质（开启阴影等）。
   * ⚠️ 【避坑指南】：因为网络下载慢，这个周期的触发会远远晚于 `onMount`。所以，所有需要读取“外部模型骨骼/顶点/长宽高”的
   *               任何核心逻辑，**绝对不能**写在 `constructor` 或 `onMount` 里面，必须且只能写在 `onLoaded` 内部！
   */
  protected onLoaded(): void {}

  /**
   * 4️⃣ 【生命周期：每帧驱动 (Update / Tick Loop)】
   * ───
   * 📌 【触发时机】：由于托管在全局扁平注册表内，当画面每重绘一帧（每秒 60 到 144 次），这里就会被疯狂调用一次。
   * 🎯 【设计目的】：专门处理与时间流逝有关的所有三维动画、物理位移或实时逻辑更新。
   * @param deltaTime 自上一帧渲染到当前帧渲染之间，流逝的绝对时间差（秒，通常是 0.016 秒左右）。
   * 🛠️ 【经典场景】：风车或者雷达的实时旋转（this.rotation.y += speed * deltaTime）、怪物头顶的 UI 标签每一帧实时朝向摄像机。
   * ⚠️ 【避坑指南】：
   *    1. 里面的所有物理位移/动画公式，**必须乘以 `deltaTime`**！这样才能保证物体在 60 帧和 144 帧电脑上的运动速度完全一致。
   *    2. 由于该函数每秒执行几十上百次，里面**绝对不要**写任何 `new` 新对象、创建大数组、或者打印 `console.log` 的操作，
   *       否则会在几秒钟内引发疯狂的垃圾回收（GC），造成严重的画面卡顿。
   */
  public update(deltaTime: number): void {}

  /**
   * 5️⃣ 【生命周期：卸载 (Unmount)】
   * ───
   * 📌 【触发时机】：当执行了 `scene.remove(this)`，或者是父级组被移除，导致该物体短暂离开 3D 渲染视角的瞬间。
   * 🎯 【设计目的】：充当应用层业务逻辑的“环卫工人”，彻底打扫该物体带来的异步副作用。
   * 🛠️ 【经典场景】：【必须】用来干掉在 `onMount` 中启动的定时器（clearInterval）、解绑全局消息和 WebSocket。
   * ⚠️ 【避坑指南】：
   *    1. **不要在里面释放 GPU 显存（即不要调用 .dispose()）**！因为离开场景可能只是暂时的（比如放进对象池），
   *       如果在这里把显存杀了，下次重新 add 回场景时，这个模型就会变成一片黑块或直接报错。
   *    2. 必须把定时器清理写干净，否则哪怕物体在 3D 画面上已经彻底看不见了，它的后台 JS 代码依然会永无止境地空转！
   */
  protected onUnmount(): void {}

  /**
   * 6️⃣ 【生命周期：临终遗言 (Destroying)】
   * ───
   * 📌 【触发时机】：当你确定这个物体彻底报废（比如怪物血量归零、UI被永久关闭），主动调用 `.destroy()` 这一瞬间。
   * 🎯 【设计目的】：在物理和显存生命终结前，做最后的业务层面交待。
   * 🛠️ 【经典场景】：向全局计分板发送消息（“我死了，请给玩家加10分”）、在当前位置动态生成（new）一个新的爆炸烟雾特效。
   * ⚠️ 【避坑指南】：这是它活在这个世界上的最后一刻，此函数执行完后，该对象的事件和显存就会被物理粉碎，所以不要再做任何异步延迟操作。
   */
  protected onDestroying(): void {}

  /**
   * ===================================================================================
   * 📦 控制核心：高级显隐、阻挡判定与终极显存自毁释放逻辑
   * ===================================================================================
   */

  /**
   * 统一的高级显隐控制方法
   * @param visible 显隐状态
   * @param disableInteraction 是否同步关闭交互。默认为 true，完美解决“模型隐形了却依然能挡住身后点击”的空气墙 Bug。
   */
  public setVisibility(
    visible: boolean,
    disableInteraction: boolean = true,
  ): void {
    this.visible = visible;
    if (disableInteraction) {
      this._isInteractable = visible;
    }
  }

  /**
   * 供外部事件管理器（RaycastManager）扫描时的复合权限判定
   * 只有当：允许交互(true) 并且 （资产已经网络下载完毕(true) 或 内部自带本地网格）时，才会通过射线的物理验证
   */
  public get isInteractable(): boolean {
    return this._isInteractable && (this._isLoaded || this.children.length > 0);
  }

  /** 获取资产加载状态 */
  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * ☠️ 彻底摧毁并释放资源（物体生命的终点站）
   * 当你需要让一个物体永久消失、不留痕迹时，直接且仅需在外界或内部调用此方法。
   */
  public destroy(): void {
    // A. 率先触发临终钩子（交待最后的事情）
    this.onDestroying();

    // B. 触发卸载钩子，并将其从场景树中安全地物理移除
    this.onUnmount();
    if (this.parent) {
      this.parent.remove(this);
    }

    // C. 💡 【最核心的安全闭环】：彻底清空 4 大高级手势的订阅队列！
    // 强制斩断外界和内部闭包函数的任何引用，让 JS 的垃圾回收器（GC）可以秒速把它回收，防止内存泄漏。
    this._clickListeners.length = 0;
    this._dragStartListeners.length = 0;
    this._dragMoveListeners.length = 0;
    this._dragEndListeners.length = 0;

    // D. 深度递归遍历所有子网格，将 Geometry(顶点数据) 和 Material(材质贴图) 执行 dispose 彻底从 GPU 显存中抹除
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

    // E. 彻底清空标签引用
    this.tags.clear();
    console.log(
      "[GameObject3D] 自毁程序闭环运行完毕。该对象的内存空间、事件管道、物理渲染树节点、GPU显存资产已全部完美彻底释放。",
    );
  }
}
