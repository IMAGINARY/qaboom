import { Graphics } from "pixi.js";
import { getBlochCoords, getOrtho, randomQubit, type Qubit } from "../quantum";
import { getColor } from "../colors";
import { PIECE_RADIUS } from "../constants";
import GameNode from "./GameNode";

// Represents a measurement along an axis
export default class MeasurementPiece extends GameNode {
  sprite: Graphics;
  base: Qubit;
  ortho: Qubit;
  constructor(base: Qubit) {
    super();
    this.base = base;
    this.ortho = getOrtho(base);
    this.sprite = new Graphics();
    this.view.addChild(this.sprite);
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
