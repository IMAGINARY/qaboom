import { CELL_SIZE } from "../constants";
import { randomQubit, type Qubit } from "../quantum";
import QubitPiece from "./QubitPiece";
import GameNode from "./GameNode";
import { Container } from "pixi.js";

type Orientation = "vertical" | "horizontal";
// A pair of qubits
export default class QubitPair extends GameNode {
  container: Container;
  first: QubitPiece;
  second: QubitPiece;
  orientation: Orientation = "vertical";

  constructor(first: Qubit, second: Qubit) {
    super();
    this.container = new Container();
    this.view.addChild(this.container);

    this.first = new QubitPiece(first);
    this.second = new QubitPiece(second);
    this.container.addChild(this.first.view);
    this.container.addChild(this.second.view);
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

  static random() {
    return new QubitPair(randomQubit(), randomQubit());
  }
}
