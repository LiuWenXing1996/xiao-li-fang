import { Color, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Board } from "./Board";

export default class Game {
    scene: Scene;
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    private isPaused: boolean = false;
    board: Board;
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
        // camera.lookAt(this.mapSize.width / 2, this.mapSize.height / 2, this.mapSize.depth / 2);

        this.board = new Board(10);
        scene.add(this.board);

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