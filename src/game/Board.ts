import { Object3D } from "three";
import PolyominoList from "./PolyominoList";
import CubeSplitter from "./CubeSplitter";
import Polyomino from "./Polyomino";
import { randomColor } from "./utils";

export class Board extends Object3D {
  polyominoList: PolyominoList;
  cubeSplitter: CubeSplitter;
  size: number;

  constructor(size: number) {
    super();
    this.size = size;
    this.polyominoList = new PolyominoList();
    this.add(this.polyominoList);
    this.cubeSplitter = new CubeSplitter();
  }
  splitCube() {
    const cubeSize = 6; // 实际立方体大小
    const polyominoList = this.cubeSplitter.split(cubeSize, 10);
    polyominoList.map((p) => {
      const polyomino = new Polyomino({
        cubes: p.blocks.map((e) => {
          return {
            position: {
              x: e.x,
              y: e.y,
              z: e.z,
            },
            color: randomColor(),
          };
        }),
        color: randomColor(),
      });
      // polyomino.position.set(p.id, 0, 0);
      // TODO:把他们并列排开，让用户可以滑动选择
      // polyomino.scale.set(0.5, 0.5, 0.5);
      this.polyominoList.add(polyomino);
    });
    // 将 polyominoList 平移，使立方体中心位于原点
    // 立方体位置从 (0,0,0) 到 (cubeSize-1,cubeSize-1,cubeSize-1)，中心在 ((cubeSize-1)/2, (cubeSize-1)/2, (cubeSize-1)/2)
    const offset = (cubeSize - 1) / 2;
    this.polyominoList.position.set(-offset, -offset, -offset);
  }
}