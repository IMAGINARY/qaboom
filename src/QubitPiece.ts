import { Graphics } from "pixi.js";
import { getBlochCoords, randomQubit, type Qubit } from "./quantum";
import { PIECE_RADIUS } from "./constants";
import { getColor } from "./colors";
// A qubit is the basic "piece" that exists in the grid.
// It has a 3D rotation and amplitude, which are represented in 2D
// using colors.
export default class QubitPiece {
  // The qubit value
  value: Qubit;
  sprite: Graphics;

  constructor(value: Qubit) {
    this.value = value;
    this.sprite = new Graphics();
    this.setValue(this.value);
  }

  // return a random qubit
  static random() {
    return new QubitPiece(randomQubit());
  }

  setValue(value: Qubit) {
    this.value = value;
    const { phi, theta } = getBlochCoords(value);
    const length = Math.sin(theta);
    const secondaryColor = theta > Math.PI / 2 ? "black" : "white";
    this.sprite
      .clear()
      .circle(0, 0, PIECE_RADIUS)
      .stroke({ color: secondaryColor, width: 2 })
      .fill(getColor(getBlochCoords(this.value)))
      .moveTo(0, 0)
      .lineTo(
        Math.cos(phi) * PIECE_RADIUS * length,
        Math.sin(phi) * PIECE_RADIUS * length
      )
      .stroke({ color: secondaryColor, width: 2 });
  }
}
