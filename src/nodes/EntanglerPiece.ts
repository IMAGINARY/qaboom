import { Graphics, Point } from "pixi.js";
import { PIECE_RADIUS } from "../constants";
import GameNode from "./GameNode";

// A piece that creates an entangled pair when activated.
export default class EntanglerPiece extends GameNode {
  target: Point;

  constructor() {
    super();
    this.target = new Point(0, 0);
    this.view.addChild(new Graphics().circle(0, 0, PIECE_RADIUS).fill("grey"));
  }

  tick() {}
}
