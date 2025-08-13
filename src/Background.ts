import { BlurFilter, ColorMatrixFilter, NoiseFilter } from "pixi.js";
import GameNode from "./GameNode";
import { CELL_SIZE, HEIGHT, WIDTH } from "./constants";
import QubitPiece from "./QubitPiece";
import { randomBasis } from "./quantum";

// A background of qubits
export default class Background extends GameNode {
  constructor() {
    super();
    const matrixFilter = new ColorMatrixFilter();
    matrixFilter.saturate(-0.5);
    this.view.filters = [
      new BlurFilter({ strength: 4 }),
      matrixFilter,
      new NoiseFilter({ noise: 0.5 }),
    ];
    const scale = 0.75;
    this.view.scale = scale;
    this.view.alpha = 0.33;
    for (let x = 0; x < Math.ceil(WIDTH / CELL_SIZE / scale); x++) {
      for (let y = 0; y < Math.ceil(HEIGHT / CELL_SIZE / scale); y++) {
        const piece = new QubitPiece(randomBasis());
        piece.view.position = { x: x * CELL_SIZE, y: y * CELL_SIZE };
        this.view.addChild(piece.view);
      }
    }
  }
}
