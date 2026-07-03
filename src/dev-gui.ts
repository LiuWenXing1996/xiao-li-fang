import GUI from "lil-gui";
import type Game from "./game/index.ts";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { GridHelper } from "three";
import CustomAxesHelper from "./game/CustomAxesHelper";

const gui = new GUI({
  title: "积木开发测试",
  closeFolders: true,
});
gui.domElement.style.maxHeight = "500px";
/**
 * 添加开发用的gui
 * @param game 游戏实例
 */
export const addSceneGui = (game: Game) => {
  const folder = gui.addFolder("场景管理");
  // 支持自由视角切换
  {
    const controls = new OrbitControls(game.camera, game.renderer.domElement);
    controls.enabled = false;
    folder
      .add({ controlsEnabled: false }, "controlsEnabled")
      .name("开启自由视角")
      .onChange((value: boolean) => {
        controls.enabled = value;
        if (!value) {
          controls.reset();
        }
      });
  }
  // 显示坐标轴
  {
    const axesHelper = new CustomAxesHelper();
    // axesHelper.setColors("red", "green", "blue"); // 设置坐标轴颜色
    axesHelper.visible = false;
    game.scene.add(axesHelper);
    folder
      .add({ axisHelperVisible: false }, "axisHelperVisible")
      .name("显示坐标轴")
      .onChange((value: boolean) => {
        axesHelper.visible = value;
      });
  }
  // 显示网格线
  {
    const gridHelper = new GridHelper(100, 100);
    gridHelper.visible = false;
    game.scene.add(gridHelper);
    folder
      .add({ gridHelperVisible: false }, "gridHelperVisible")
      .name("显示网格线")
      .onChange((value: boolean) => {
        gridHelper.visible = value;
      });
  }
};
export const addCubeGui = (game: Game) => {
  const folder = gui.addFolder("积块调试");
  // 分割大积块
  {
    folder
      .add(
        {
          split: () => {
            game.board.splitCube();
          },
        },
        "split",
      )
      .name("分割大积块");
  }
};

export const initGui = (game: Game) => {
  addSceneGui(game);

  addCubeGui(game);
};
