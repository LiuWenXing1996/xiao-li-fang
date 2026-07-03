// TODO:继续优化算法
/**
 * TODO：算法步骤
 * 1. 随机生成 m 个不重复的起始点，每个点属于一个积木
 * 2. 每轮循环
 *     1. 随机挑选 k 个未被积木占有的方块；k 是一个根据当前未被占用的方块数量动态调整的参数
 *     2. 遍历这些方块
 *          1. 检查方块周围的积木列表
 *          2. 随机挑选一个积木加入
 *     3. 直到所有方块都加入积木
 */
/**
 * 三维坐标点类，用于表示立方体网格中的位置
 */
class Point3D {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    toString(): string {
        return `${this.x},${this.y},${this.z}`;
    }

    clone(): Point3D {
        return new Point3D(this.x, this.y, this.z);
    }
}

/**
 * 多格骨牌类，表示一个由多个小方块组成的不规则积木
 */
class Polyomino {
    private _blocks: Point3D[] = [];
    readonly id: number;

    constructor(id: number) {
        this.id = id;
    }

    get blocks(): readonly Point3D[] {
        return this._blocks;
    }

    get size(): number {
        return this._blocks.length;
    }

    addBlock(point: Point3D): void {
        this._blocks.push(point);
    }

    getAllNeighbors(n: number): Point3D[] {
        const neighbors: Point3D[] = [];
        const directions = [
            { dx: 1, dy: 0, dz: 0 },
            { dx: -1, dy: 0, dz: 0 },
            { dx: 0, dy: 1, dz: 0 },
            { dx: 0, dy: -1, dz: 0 },
            { dx: 0, dy: 0, dz: 1 },
            { dx: 0, dy: 0, dz: -1 },
        ];

        for (let i = 0; i < this._blocks.length; i++) {
            const block = this._blocks[i];
            for (let j = 0; j < directions.length; j++) {
                const dir = directions[j];
                const nx = block.x + dir.dx;
                const ny = block.y + dir.dy;
                const nz = block.z + dir.dz;

                if (nx >= 0 && nx < n && ny >= 0 && ny < n && nz >= 0 && nz < n) {
                    const newPoint = new Point3D(nx, ny, nz);
                    let exists = false;
                    for (let k = 0; k < neighbors.length; k++) {
                        if (neighbors[k].x === newPoint.x && neighbors[k].y === newPoint.y && neighbors[k].z === newPoint.z) {
                            exists = true;
                            break;
                        }
                    }
                    let isOwnBlock = false;
                    for (let k = 0; k < this._blocks.length; k++) {
                        if (this._blocks[k].x === newPoint.x && this._blocks[k].y === newPoint.y && this._blocks[k].z === newPoint.z) {
                            isOwnBlock = true;
                            break;
                        }
                    }
                    if (!exists && !isOwnBlock) {
                        neighbors.push(newPoint);
                    }
                }
            }
        }

        return neighbors;
    }
}

/**
 * 立方体分割器类，实现将 n×n×n 的立方体分割成 m 个不规则积木的算法
 * 采用公平生长策略：所有积木同时随机生长，直到填满整个立方体
 */
export default class CubeSplitter {
    private grid: boolean[][][] = [];
    private n: number = 0;

    /**
     * 将 n×n×n 的立方体分割成 m 个不规则积木
     * @param n 立方体的边长
     * @param m 要分割成的积木数量
     * @returns 分割后的积木数组
     */
    split(n: number, m: number): Polyomino[] {
        const totalBlocks = n * n * n;
        if (m > totalBlocks) {
            throw new Error(`Cannot split ${n}x${n}x${n} cube into ${m} polyominoes (max ${totalBlocks})`);
        }

        this.n = n;
        this.initGrid();

        // 步骤1: 随机生成 m 个不重复的起始点，每个点属于一个积木
        const startPoints = this.generateDistinctStartPoints(m);
        const polyominoes: Polyomino[] = [];

        for (let i = 0; i < m; i++) {
            const polyomino = new Polyomino(i);
            const point = startPoints[i];
            this.grid[point.x][point.y][point.z] = true;
            polyomino.addBlock(point);
            polyominoes.push(polyomino);
        }

        // 收集所有未被占用的方块
        const unoccupied: Point3D[] = [];
        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                for (let z = 0; z < n; z++) {
                    if (!this.grid[x][y][z]) {
                        unoccupied.push(new Point3D(x, y, z));
                    }
                }
            }
        }

        // 步骤2: 每轮循环直到所有方块都加入积木
        while (unoccupied.length > 0) {
            // 步骤2.1: 随机挑选 k 个未被积木占有的方块
            // k 是根据当前未被占用的方块数量动态调整的参数
            const k = Math.max(1, Math.min(10, Math.floor(unoccupied.length / m) + 1));
            const pickCount = Math.min(k, unoccupied.length);

            // 随机打乱未占用方块列表
            for (let i = unoccupied.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = unoccupied[i];
                unoccupied[i] = unoccupied[j];
                unoccupied[j] = temp;
            }

            // 步骤2.2: 遍历挑选出的方块
            const toProcess = unoccupied.splice(0, pickCount);
            for (let i = 0; i < toProcess.length; i++) {
                const block = toProcess[i];

                // 步骤2.2.1: 检查方块周围的积木列表
                const adjacentPolyominoes = this.getAdjacentPolyominoes(block, polyominoes, n);

                if (adjacentPolyominoes.length > 0) {
                    // 步骤2.2.2: 随机挑选一个积木加入
                    const randomIndex = Math.floor(Math.random() * adjacentPolyominoes.length);
                    const targetPolyomino = adjacentPolyominoes[randomIndex];
                    targetPolyomino.addBlock(block);
                    this.grid[block.x][block.y][block.z] = true;
                } else {
                    // 如果没有相邻积木，放回列表末尾等待下一轮
                    unoccupied.push(block);
                }
            }
        }

        return polyominoes;
    }

    /**
     * 获取与指定方块相邻的所有积木
     * @param block 目标方块
     * @param polyominoes 所有积木列表
     * @param n 立方体边长
     * @returns 相邻的积木数组
     */
    private getAdjacentPolyominoes(block: Point3D, polyominoes: Polyomino[], n: number): Polyomino[] {
        const adjacent: Polyomino[] = [];
        const directions = [
            { dx: 1, dy: 0, dz: 0 },
            { dx: -1, dy: 0, dz: 0 },
            { dx: 0, dy: 1, dz: 0 },
            { dx: 0, dy: -1, dz: 0 },
            { dx: 0, dy: 0, dz: 1 },
            { dx: 0, dy: 0, dz: -1 },
        ];

        for (let i = 0; i < directions.length; i++) {
            const dir = directions[i];
            const nx = block.x + dir.dx;
            const ny = block.y + dir.dy;
            const nz = block.z + dir.dz;

            if (nx >= 0 && nx < n && ny >= 0 && ny < n && nz >= 0 && nz < n) {
                if (this.grid[nx][ny][nz]) {
                    // 找到相邻的被占用方块，确定它属于哪个积木
                    for (let j = 0; j < polyominoes.length; j++) {
                        const polyomino = polyominoes[j];
                        let belongs = false;
                        for (let k = 0; k < polyomino.blocks.length; k++) {
                            const b = polyomino.blocks[k];
                            if (b.x === nx && b.y === ny && b.z === nz) {
                                belongs = true;
                                break;
                            }
                        }
                        if (belongs) {
                            // 避免重复添加同一个积木
                            let exists = false;
                            for (let k = 0; k < adjacent.length; k++) {
                                if (adjacent[k].id === polyomino.id) {
                                    exists = true;
                                    break;
                                }
                            }
                            if (!exists) {
                                adjacent.push(polyomino);
                            }
                        }
                    }
                }
            }
        }

        return adjacent;
    }

    /**
     * 初始化三维网格，所有位置标记为未占用（false）
     */
    private initGrid(): void {
        const grid: boolean[][][] = [];
        for (let x = 0; x < this.n; x++) {
            const row: boolean[][] = [];
            for (let y = 0; y < this.n; y++) {
                const col: boolean[] = [];
                for (let z = 0; z < this.n; z++) {
                    col.push(false);
                }
                row.push(col);
            }
            grid.push(row);
        }
        this.grid = grid;
    }

    /**
     * 生成 m 个不重复的随机起始点
     * @param m 起始点数量
     * @returns 不重复的起始点数组
     */
    private generateDistinctStartPoints(m: number): Point3D[] {
        const points: Point3D[] = [];
        const used: boolean[][][] = [];

        for (let x = 0; x < this.n; x++) {
            const row: boolean[][] = [];
            for (let y = 0; y < this.n; y++) {
                const col: boolean[] = [];
                for (let z = 0; z < this.n; z++) {
                    col.push(false);
                }
                row.push(col);
            }
            used.push(row);
        }

        for (let i = 0; i < m; i++) {
            let point: Point3D;
            do {
                const x = Math.floor(Math.random() * this.n);
                const y = Math.floor(Math.random() * this.n);
                const z = Math.floor(Math.random() * this.n);
                point = new Point3D(x, y, z);
            } while (used[point.x][point.y][point.z]);

            used[point.x][point.y][point.z] = true;
            points.push(point);
        }

        return points;
    }
}