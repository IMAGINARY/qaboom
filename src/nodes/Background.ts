import { BlurFilter, ColorMatrixFilter, NoiseFilter, Ticker } from "pixi.js";
import GameNode from "./GameNode";
import { CELL_SIZE, HEIGHT, WIDTH } from "../constants";
import QubitPiece from "./QubitPiece";
import { randomQubit, type Qubit } from "../quantum";
import { range } from "../random";

const scale = 0.75;
const piecesWidth = Math.ceil(WIDTH / CELL_SIZE / scale);
const piecesHeight = Math.ceil(HEIGHT / CELL_SIZE / scale);
// A background of qubits
export default class Background extends GameNode {
  generator = randomQubit;
  pieces: QubitPiece[] = [];
  constructor() {
    super();
    const matrixFilter = new ColorMatrixFilter();
    matrixFilter.saturate(-0.5);
    this.view.filters = [
      new BlurFilter({ strength: 4 }),
      matrixFilter,
      new NoiseFilter({ noise: 0.5 }),
    ];
    this.view.scale = scale;
    this.view.alpha = 0.33;
    for (let x = 0; x < piecesWidth; x++) {
      for (let y = 0; y < piecesHeight; y++) {
        const piece = new QubitPiece(this.generator());
        this.pieces.push(piece);
        piece.view.position = { x: x * CELL_SIZE, y: y * CELL_SIZE };
        this.view.addChild(piece.view);
      }
    }
  }

  setGenerator(generator: () => Qubit) {
    this.generator = generator;
    for (let piece of this.pieces) {
      piece.setValue(this.generator());
    }
  }

  tick = (time: Ticker) => {
    for (let piece of this.pieces) {
      piece.tick(time);
    }
    if (Math.random() < 0.05) {
      const x = range(0, piecesWidth);
      const y = range(0, piecesHeight);
      this.pieces[y * piecesWidth + x].setValue(this.generator());
    }
  };
}
