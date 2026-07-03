import { Object3D } from "three";
import Polyomino, { type PolyominoConfig } from "./Polyomino";

export default class PolyominoList extends Object3D {
    constructor() {
        super();
    }
    addPolyomino(config: PolyominoConfig) {
        const polyomino = new Polyomino(config);
        this.add(polyomino);
    }
}