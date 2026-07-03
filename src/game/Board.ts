import { Object3D } from "three";
import PolyominoList from "./PolyominoList";
import CubeSplitter from "./CubeSplitter";
import Polyomino from "./Polyomino";
import { randomColor } from "./utils";

export class Board extends Object3D {
  polyominoList: PolyominoList;
  cubeSplitter: CubeSplitter;
  size: number;
  usedColors: string[] = []; // 存储已使用的颜色

  constructor(size: number) {
    super();
    this.size = size;
    this.polyominoList = new PolyominoList();
    this.add(this.polyominoList);
    this.cubeSplitter = new CubeSplitter();
    this.usedColors = []; // 初始化颜色数组
  }
  
  splitCube() {
    const cubeSize = 6;
    const polyominoList = this.cubeSplitter.split(cubeSize, 10);
    
    // 随机选择一个积木作为白色积木（问号积木）
    const questionIndex = Math.floor(Math.random() * polyominoList.length);

    polyominoList.map((p, index) => {
      const isQuestion = index === questionIndex;
      const polyominoColor = isQuestion ? "#FFFFFF" : randomColor();

      // 如果不是白色积木，记录颜色
      if (!isQuestion) {
        this.usedColors.push(polyominoColor);
      }

      const polyomino = new Polyomino({
        cubes: p.blocks.map((e) => {
          return {
            position: {
              x: e.x,
              y: e.y,
              z: e.z,
            },
            color: polyominoColor,
            isQuestion: isQuestion,
          };
        }),
        color: polyominoColor,
        isQuestion: isQuestion,
      });
      this.polyominoList.add(polyomino);
    });

    const offset = (cubeSize - 1) / 2;
    this.polyominoList.position.set(-offset, -offset, -offset);
  }
}