import "./style.css";
import Game from "./game/index.ts";
import { initGui } from "./dev-gui.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<div id="game-container">
  <canvas id="canvas"></canvas>
</div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const game = new Game(canvas);
initGui(game);