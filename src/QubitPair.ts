import { Container } from "pixi.js";
import { CELL_SIZE } from "./constants";
import { randomQubit, type Qubit } from "./quantum";
import QubitPiece from "./QubitPiece";

type Orientation = "vertical" | "horizontal";
// A pair of qubits
export default class QubitPair {
  sprite: Container;
  first: QubitPiece;
  second: QubitPiece;
  orientation: Orientation = "vertical";

  constructor(first: Qubit, second: Qubit) {
    this.sprite = new Container();
    this.first = new QubitPiece(first);
    this.second = new QubitPiece(second);
    this.sprite.addChild(this.first.sprite);
    this.sprite.addChild(this.second.sprite);
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
    this.first.sprite.position = { x: 0, y: 0 };
    if (this.orientation === "vertical") {
      this.second.sprite.position = { x: 0, y: -CELL_SIZE };
    } else {
      this.second.sprite.position = { x: CELL_SIZE, y: 0 };
    }
  }

  static random() {
    return new QubitPair(randomQubit(), randomQubit());
  }
}
