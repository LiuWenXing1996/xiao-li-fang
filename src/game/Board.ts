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
    const polyominoList = this.cubeSplitter.split(6, 10);
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
  }
}
