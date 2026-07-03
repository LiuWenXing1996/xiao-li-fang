import { Object3D } from "three";
import PolyominoCube from "./PolyominoCube";

export interface PolyominoConfig {
  cubes: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    color: string;
  }[];
  color: string;
}

export default class Polyomino extends Object3D {
  cubeList: PolyominoCube[] = [];
  constructor(config: PolyominoConfig) {
    super();
    this.cubeList = [];
    const { cubes, color } = config;
    for (const block of cubes) {
      const { x, y, z } = block.position;
      const cube = new PolyominoCube({ boxColor: color });
      // const cube = new PolyominoCube({ boxColor: block.color });
      cube.position.set(x, y, z);
      this.add(cube);
      this.cubeList.push(cube);
    }
  }
}

