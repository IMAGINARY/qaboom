import { Container, Graphics } from "pixi.js";
import { container } from "../util";
import GameNode from "./GameNode";
import type { Piece } from "./Deck";
import QubitPair from "./QubitPair";
import { CELL_SIZE } from "../constants";

const width = 200;
const height = 200;
export default class HoldArea extends GameNode {
  held: Piece | null = null;
  container: Container = new Container();
  constructor() {
    super();
    this.view.scale = 0.75;
    this.view.addChild(
      container(new Graphics().roundRect(0, 0, width, height))
    );

    this.view.addChild(this.container);
    this.container.position = { x: 100, y: 100 };
  }

  setHold(piece: Piece) {
    const previous = this.held;
    this.held = piece;
    this.container.addChild(this.held.view);
    this.held.view.position = { x: 0, y: 0 };
    if (piece instanceof QubitPair) {
      if (piece.orientation === "vertical") {
        this.held.view.position.y += CELL_SIZE / 2;
      } else {
        this.held.view.position.x -= CELL_SIZE / 2;
      }
    }
    return previous;
  }
}
