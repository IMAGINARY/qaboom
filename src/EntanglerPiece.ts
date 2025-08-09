import { Container, Graphics, Point } from "pixi.js";
import { PIECE_RADIUS } from "./constants";

// A piece that creates an entangled pair when activated.
export default class EntanglerPiece {
  target: Point;
  sprite: Container;

  constructor() {
    this.target = new Point(0, 0);
    this.sprite = new Container();
    this.sprite.addChild(
      new Graphics().circle(0, 0, PIECE_RADIUS).fill("grey")
    );
  }

  tick() {}
}
