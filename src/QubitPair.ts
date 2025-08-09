import { Container, Ticker } from "pixi.js";
import { CELL_SIZE } from "./constants";
import { randomQubit, type Qubit } from "./quantum";
import SingleQubit from "./SingleQubit";

type Orientation = "vertical" | "horizontal";
// A pair of qubits
export default class QubitPair {
  sprite: Container;
  first: SingleQubit;
  second: SingleQubit;
  orientation: Orientation = "vertical";

  constructor(first: Qubit, second: Qubit) {
    this.sprite = new Container();
    this.first = new SingleQubit(first);
    this.second = new SingleQubit(second);
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

  tick(_time: Ticker) {}

  static random() {
    return new QubitPair(randomQubit(), randomQubit());
  }
}
