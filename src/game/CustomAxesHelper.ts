import { Object3D, CylinderGeometry, Mesh, MeshBasicMaterial } from "three";

/**
 * 粗坐标轴辅助类
 * 使用圆柱体替代传统线条，避免 WebGL linewidth 限制
 */
export default class CustomAxesHelper extends Object3D {
  constructor(length: number = 100, radius: number = 0.3) {
    super();
    this.createAxes(length, radius);
  }

  private createAxes(length: number, radius: number): void {
    this.add(this.createAxis("#ff0000", "x", length, radius)); // X轴（红色）
    this.add(this.createAxis("#00ff00", "y", length, radius)); // Y轴（绿色）
    this.add(this.createAxis("#0000ff", "z", length, radius)); // Z轴（蓝色）
  }

  private createAxis(
    color: string,
    direction: "x" | "y" | "z",
    length: number,
    radius: number,
  ): Mesh {
    const geometry = new CylinderGeometry(radius, radius, length, 16);
    const material = new MeshBasicMaterial({ color });
    const cylinder = new Mesh(geometry, material);

    switch (direction) {
      case "x":
        cylinder.rotation.z = Math.PI / 2;
        cylinder.position.x = length / 2;
        break;
      case "y":
        cylinder.position.y = length / 2;
        break;
      case "z":
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.z = length / 2;
        break;
    }
    return cylinder;
  }

  dispose(): void {
    this.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        if (child.material instanceof MeshBasicMaterial) {
          child.material.dispose();
        }
      }
    });
  }
}
