import { Color, PerspectiveCamera, Scene, WebGLRenderer, MathUtils, Vector3, Quaternion, Euler } from "three";
import { Board } from "./Board";

export default class Game {
    scene: Scene;
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    private isPaused: boolean = false;
    board: Board;
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private isDragging: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        const renderer = new WebGLRenderer({ antialias: true, canvas });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const scene = new Scene();
        scene.background = new Color(0x1a1a2e);
        this.scene = scene;
        this.renderer = renderer;

        const targetAspect = 9 / 16;
        const camera = new PerspectiveCamera(
            45,
            targetAspect,
            0.1,
            3000,
        );
        this.camera = camera;
        camera.position.set(25, 25, 25);
        camera.lookAt(0, 0, 0);

        this.board = new Board(10);
        scene.add(this.board);
        this.board.splitCube();

        // 添加触摸事件监听
        this.setupTouchEvents(canvas);

        function resizeRendererToDisplaySize(renderer: WebGLRenderer) {
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
        const game = this;

        function animate(time: number) {
            if (resizeRendererToDisplaySize(renderer)) {
                camera.aspect = targetAspect;
                camera.updateProjectionMatrix();
            }
            if (!game.isPaused) {
                game.update(time);
            }
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
    }

    private setupTouchEvents(canvas: HTMLCanvasElement) {
        // 触摸开始
        canvas.addEventListener("touchstart", (event) => {
            event.preventDefault(); // 阻止默认行为
            const touch = event.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.isDragging = true;
        }, { passive: false });

        // 触摸移动
        canvas.addEventListener("touchmove", (event) => {
            event.preventDefault(); // 阻止默认行为（防止页面滚动）
            if (!this.isDragging) return;
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            // 根据滑动距离计算旋转角度
            const rotationSpeed = 0.01; // 旋转速度系数

            // 获取相机的方向向量
            const cameraRight = new Vector3();
            const cameraUp = new Vector3();
            this.camera.matrix.extractBasis(cameraRight, cameraUp, new Vector3());
            
            // 左右滑动：绕世界Y轴旋转（保持上下方向不变）
            this.board.rotation.y += deltaX * rotationSpeed;
            
            // 上下滑动：绕相机的水平轴（right向量）旋转，这样看起来更自然
            const rightRotation = new Quaternion().setFromAxisAngle(cameraRight, deltaY * rotationSpeed);
            this.board.quaternion.premultiply(rightRotation);

            // 限制倾斜角度（将四元数转换回欧拉角进行限制）
            const euler = new Euler().setFromQuaternion(this.board.quaternion);
            euler.x = MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2);
            this.board.quaternion.setFromEuler(euler);

            // 更新起始位置
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: false });

        // 触摸结束
        canvas.addEventListener("touchend", (event) => {
            event.preventDefault();
            this.isDragging = false;
        }, { passive: false });

        // ========== 鼠标事件支持（用于桌面测试） ==========
        canvas.addEventListener("mousedown", (event) => {
            this.touchStartX = event.clientX;
            this.touchStartY = event.clientY;
            this.isDragging = true;
        });

        canvas.addEventListener("mousemove", (event) => {
            if (!this.isDragging) return;
            
            const deltaX = event.clientX - this.touchStartX;
            const deltaY = event.clientY - this.touchStartY;

            const rotationSpeed = 0.01;

            // 获取相机的方向向量
            const cameraRight = new Vector3();
            const cameraUp = new Vector3();
            this.camera.matrix.extractBasis(cameraRight, cameraUp, new Vector3());
            
            // 左右滑动：绕世界Y轴旋转
            this.board.rotation.y += deltaX * rotationSpeed;
            
            // 上下滑动：绕相机的水平轴旋转
            const rightRotation = new Quaternion().setFromAxisAngle(cameraRight, deltaY * rotationSpeed);
            this.board.quaternion.premultiply(rightRotation);

            // 限制倾斜角度
            const euler = new Euler().setFromQuaternion(this.board.quaternion);
            euler.x = MathUtils.clamp(euler.x, -Math.PI / 2, Math.PI / 2);
            this.board.quaternion.setFromEuler(euler);

            this.touchStartX = event.clientX;
            this.touchStartY = event.clientY;
        });

        canvas.addEventListener("mouseup", () => {
            this.isDragging = false;
        });

        canvas.addEventListener("mouseleave", () => {
            this.isDragging = false;
        });
    }
    start() {
    }
    pause() {
        this.isPaused = true;
    }
    resume() {
        this.isPaused = false;
    }
    isGamePaused(): boolean {
        return this.isPaused;
    }
    update(time: number): void {
    }
}