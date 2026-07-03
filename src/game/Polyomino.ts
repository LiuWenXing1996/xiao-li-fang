import { Object3D, LineSegments, EdgesGeometry, LineBasicMaterial, BoxGeometry, Mesh, MeshBasicMaterial, Color } from "three";
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
  private isSelected: boolean = false;
  private highlightedEdges: Object3D[] = [];
  private originalColors: Color[] = []; // 保存每个立方体的原始颜色

  constructor(config: PolyominoConfig) {
    super();
    this.cubeList = [];
    const { cubes, color } = config;
    const baseColor = new Color(color);
    
    for (const block of cubes) {
      const { x, y, z } = block.position;
      const cube = new PolyominoCube({ boxColor: color });
      cube.position.set(x, y, z);
      this.add(cube);
      this.cubeList.push(cube);
      
      // 保存原始颜色
      this.originalColors.push(baseColor.clone());
    }
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    
    if (selected) {
      this.highlightCubes(true);
    } else {
      this.highlightCubes(false);
    }
  }

  getSelected(): boolean {
    return this.isSelected;
  }

  private highlightCubes(highlight: boolean): void {
    // 清理之前的高亮边框
    this.highlightedEdges.forEach(edge => {
      this.remove(edge);
      edge.traverse((child) => {
        if (child instanceof LineSegments) {
          child.geometry.dispose();
          (child.material as LineBasicMaterial).dispose();
        }
      });
    });
    this.highlightedEdges = [];

    if (highlight) {
      this.cubeList.forEach((cube) => {
        // 创建多层边框效果
        const edgeContainer = new Object3D();
        
        // 外层边框
        const outerGeo = new BoxGeometry(1.06, 1.06, 1.06);
        const outerMat = new LineBasicMaterial({ 
          color: 0xff6600,
          transparent: true,
          opacity: 0.8,
        });
        const outerEdges = new LineSegments(new EdgesGeometry(outerGeo), outerMat);
        edgeContainer.add(outerEdges);

        // 中间层边框
        const midGeo = new BoxGeometry(1.04, 1.04, 1.04);
        const midMat = new LineBasicMaterial({ 
          color: 0xffaa00,
          transparent: true,
          opacity: 0.9,
        });
        const midEdges = new LineSegments(new EdgesGeometry(midGeo), midMat);
        edgeContainer.add(midEdges);

        // 内层边框
        const innerGeo = new BoxGeometry(1.02, 1.02, 1.02);
        const innerMat = new LineBasicMaterial({ 
          color: 0xffff00,
          transparent: true,
          opacity: 1,
        });
        const innerEdges = new LineSegments(new EdgesGeometry(innerGeo), innerMat);
        edgeContainer.add(innerEdges);

        edgeContainer.position.copy(cube.position);
        
        this.add(edgeContainer);
        this.highlightedEdges.push(edgeContainer);

        // 改变立方体颜色（变亮）
        cube.traverse((child) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshBasicMaterial;
            const brightenedColor = this.originalColors[0].clone().multiplyScalar(1.4);
            material.color.copy(brightenedColor);
          }
        });
      });
    } else {
      // 恢复原始颜色
      this.cubeList.forEach((cube) => {
        cube.traverse((child) => {
          if (child instanceof Mesh) {
            const material = child.material as MeshBasicMaterial;
            // 直接恢复到原始颜色，而不是基于当前颜色计算
            material.color.copy(this.originalColors[0]);
          }
        });
      });
    }
  }
}