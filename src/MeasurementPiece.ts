import { Graphics } from "pixi.js";
import {
  getBlochCoords,
  getColor,
  getOrtho,
  randomQubit,
  type Qubit,
} from "./quantum";

// Represents a measurement along an axis
export default class MeasurementPiece {
  base: Qubit;
  ortho: Qubit;
  sprite: Graphics;
  constructor(base: Qubit) {
    this.base = base;
    this.ortho = getOrtho(base);
    const baseColor = getColor(getBlochCoords(this.base));
    const orthoColor = getColor(getBlochCoords(this.ortho));
    this.sprite = new Graphics()
      .circle(0, 0, 10)
      .stroke({ color: "grey", width: 2 })
      .fill(baseColor)
      .circle(0, 2.5, 5)
      .fill(orthoColor);
  }

  static random() {
    return new MeasurementPiece(randomQubit());
  }
}
