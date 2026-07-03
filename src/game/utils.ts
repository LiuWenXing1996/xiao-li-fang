// 预定义的友好颜色列表（高对比度、对人眼友好）
export const COLORS = [
  // 红色系
  "#FF6B6B", // 珊瑚红
  "#E74C3C", // 深红
  "#C0392B", // 暗红

  // 橙色系
  "#FFA07A", // 浅橙
  "#FF8C42", // 橙
  "#E67E22", // 深橙

  // 黄色系
  "#FFE66D", // 浅黄
  "#FDCB6E", // 金黄
  "#F39C12", // 深黄

  // 绿色系
  "#88D8B0", // 浅绿
  "#55EFC4", // 青绿
  "#2ECC71", // 中绿
  "#27AE60", // 深绿

  // 蓝色系
  "#74B9FF", // 浅蓝
  "#0984E3", // 中蓝
  "#0652DD", // 深蓝

  // 紫色系
  "#A29BFE", // 浅紫
  "#6C5CE7", // 中紫
  "#4834A3", // 深紫

  // 粉色系
  "#FD79A8", // 浅粉
  "#E84393", // 中粉

  // 青色系
  "#81ECEC", // 浅青
  "#00CEC9", // 深青
];

let colorIndex = 0;

export function randomColor(): string {
  // 循环使用预定义颜色
  const color = COLORS[colorIndex % COLORS.length];
  colorIndex++;
  return color;
}

export function resetColorIndex(): void {
  colorIndex = 0;
}
