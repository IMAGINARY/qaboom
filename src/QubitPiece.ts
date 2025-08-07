import { Container, Graphics, Ticker } from "pixi.js";
import { getBlochCoords, randomQubit, type Qubit } from "./quantum";
import { PIECE_RADIUS } from "./constants";
import { getColor } from "./colors";
// A qubit is the basic "piece" that exists in the grid.
// It has a 3D rotation and amplitude, which are represented in 2D
// using colors.
export default class QubitPiece {
  // The qubit value
  value: Qubit;
  sprite: Container;
  circle: Graphics;
  rod: Graphics;
  outline: Graphics;

  constructor(value: Qubit) {
    this.value = value;
    this.sprite = new Graphics();
    this.circle = new Graphics().circle(0, 0, PIECE_RADIUS).fill("white");
    this.rod = new Graphics()
      .moveTo(0, 0)
      .lineTo(0, PIECE_RADIUS)
      .stroke({ color: "white", width: 2 });
    this.outline = new Graphics()
      .circle(0, 0, PIECE_RADIUS)
      .stroke({ color: "white", width: 1 });
    this.sprite.addChild(this.circle);
    this.sprite.addChild(this.rod);
    this.sprite.addChild(this.outline);
    this.setValue(value);
  }

  // return a random qubit
  static random() {
    return new QubitPiece(randomQubit());
  }

  tick(time: Ticker) {}

  setValue(value: Qubit) {
    this.value = value;
    const { phi, theta } = getBlochCoords(value);
    const length = Math.sin(theta);
    const secondaryColor = theta > Math.PI / 2 ? "black" : "white";
    this.circle.tint = getColor({ phi, theta });
    this.rod.rotation = phi;
    this.rod.tint = secondaryColor;
    this.rod.scale.y = length;
    this.outline.tint = secondaryColor;
  }
}
