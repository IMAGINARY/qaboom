import { Graphics } from "pixi.js";
import { getBlochCoords, getOrtho, randomQubit, type Qubit } from "./quantum";
import { getColor } from "./colors";
import { PIECE_RADIUS } from "./constants";

// Represents a measurement along an axis
export default class MeasurementPiece {
  base: Qubit;
  ortho: Qubit;
  sprite: Graphics;
  constructor(base: Qubit) {
    this.base = base;
    this.ortho = getOrtho(base);
    this.sprite = new Graphics();
    this.draw();
  }

  draw() {
    const baseColor = getColor(getBlochCoords(this.base));
    const orthoColor = getColor(getBlochCoords(this.ortho));
    this.sprite
      .clear()
      .circle(0, 0, PIECE_RADIUS)
      .stroke({ color: "grey", width: 2 })
      .fill(baseColor)
      .circle(0, 0, PIECE_RADIUS / 2)
      .fill(orthoColor);
  }

  flip() {
    [this.base, this.ortho] = [this.ortho, this.base];
    this.draw();
  }

  static random() {
    return new MeasurementPiece(randomQubit());
  }
}
