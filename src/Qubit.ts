import * as math from "mathjs";
import { GraphicsContext, Graphics } from "pixi.js";
import { getColor, getBlochCoords, randomQubit } from "./quantum";
// A qubit is the basic "piece" that exists in the grid.
// It has a 3D rotation and amplitude, which are represented in 2D
// using colors.
export default class Qubit {
  // The qubit value
  value: math.Matrix;
  sprite: Graphics;

  constructor(value: math.Matrix) {
    this.value = value;
    this.sprite = new Graphics(
      new GraphicsContext()
        .circle(0, 0, 10)
        .stroke({ color: "grey", width: 2 })
        .fill(getColor(getBlochCoords(this.value)))
    );
  }

  // return a random qubit
  static random() {
    return new Qubit(randomQubit());
  }
}
