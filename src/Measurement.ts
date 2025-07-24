import * as math from "mathjs";
import { Graphics, GraphicsContext } from "pixi.js";
import { getBlochCoords, getColor, getOrtho, randomQubit } from "./quantum";

// Represents a measurement along an axis
export default class Measurement {
  base: math.Matrix;
  ortho: math.Matrix;
  sprite: Graphics;
  constructor(base: math.Matrix) {
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
    return new Measurement(randomQubit());
  }
}
