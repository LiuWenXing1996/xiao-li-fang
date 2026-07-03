import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D } from "three";
import CubeSplitter from "./CubeSplitter";

export default class BigCube extends Object3D {
    size: number;
    constructor(size: number) {
        super();
        this.size = size;
        const geometry = new BoxGeometry(size, size, size);
        const material = new MeshBasicMaterial({ color: 0xffffff });
        const cube = new Mesh(geometry, material);
        this.add(cube);
    }
    // 随机分割成多个子积木
    split(num: number) {
        const splitter = new CubeSplitter();
        const cubes = splitter.split(this.size, num);
        for (const p of cubes) {
            console.log(`积木 ${p.id}: ${p.size} 个方块`);
        }
    }
}