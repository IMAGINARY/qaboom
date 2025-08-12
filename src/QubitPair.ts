import { Container, Ticker } from "pixi.js";
import { CELL_SIZE } from "./constants";
import { randomQubit, type Qubit } from "./quantum";
import QubitPiece from "./QubitPiece";

type Orientation = "vertical" | "horizontal";
// A pair of qubits
export default class QubitPair {
  view: Container;
  first: QubitPiece;
  second: QubitPiece;
  orientation: Orientation = "vertical";

  constructor(first: Qubit, second: Qubit) {
    this.view = new Container();
    this.first = new QubitPiece(first);
    this.second = new QubitPiece(second);
    this.view.addChild(this.first.view);
    this.view.addChild(this.second.view);
    this.setPositions();
  }

  rotate() {
    if (this.orientation === "vertical") {
      this.orientation = "horizontal";
    } else {
      this.orientation = "vertical";
      [this.first, this.second] = [this.second, this.first];
    }
    this.setPositions();
  }

  setPositions() {
    this.first.view.position = { x: 0, y: 0 };
    if (this.orientation === "vertical") {
      this.second.view.position = { x: 0, y: -CELL_SIZE };
    } else {
      this.second.view.position = { x: CELL_SIZE, y: 0 };
    }
  }

  tick(_time: Ticker) {}

  static random() {
    return new QubitPair(randomQubit(), randomQubit());
  }
}
