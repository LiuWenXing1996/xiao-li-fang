import { expect, test } from "vitest";
import CubeSplitter from "./CubeSplitter.js";

const cubeSplitter = new CubeSplitter();
test("分割的积木数量必须等于 m", () => {
  const n = 3;
  const m = 10;
  const polyominoList = cubeSplitter.split(n, m);
  expect(polyominoList.length).toBe(m);
});

test("分割的积木的小方块总数量必须等于 n^3", () => {
  const n = 3;
  const m = 10;
  const polyominoList = cubeSplitter.split(n, m);
  const total = polyominoList.reduce(
    (acc, polyomino) => acc + polyomino.blocks.length,
    0,
  );
  expect(total).toBe(n * n * n);
});
test("分割的积木的小方块必须是不重复的", () => {
  const n = 3;
  const m = 10;
  const polyominoList = cubeSplitter.split(n, m);
  for (const polyomino of polyominoList) {
    const blockSet = new Set(
      polyomino.blocks.map((block) => `${block.x},${block.y},${block.z}`),
    );
    expect(blockSet.size).toBe(polyomino.size);
  }
});
