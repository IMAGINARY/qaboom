import { Container, Graphics } from "pixi.js";
import { getBlochCoords, getOrtho, randomQubit, type Qubit } from "../quantum";
import { getColor } from "../colors";
import { PIECE_RADIUS } from "../constants";
import GameNode from "./GameNode";

// Represents a measurement along an axis
export default class MeasurementPiece extends GameNode {
  container: Container;

  sprite: Graphics;
  rod: Graphics;
  base: Qubit;
  ortho: Qubit;
  constructor(base: Qubit) {
    super();
    this.container = new Container();
    this.view.addChild(this.container);

    this.base = base;
    this.ortho = getOrtho(base);
    this.sprite = new Graphics();
    this.rod = new Graphics();
    this.container.addChild(this.sprite);
    this.container.addChild(this.rod);
    this.draw();
  }

  draw() {
    const coords = getBlochCoords(this.base);
    const baseColor = getColor(coords);
    // const secondaryColor = getSecondaryColor(coords);
    const orthoColor = getColor(getBlochCoords(this.ortho));
    this.sprite
      .clear()
      .circle(0, 0, PIECE_RADIUS)
      .stroke({ color: orthoColor, width: 2 })
      .fill(baseColor)
      .circle(0, 0, PIECE_RADIUS / 3)
      .stroke({ color: orthoColor, width: 6 });
    this.rod
      .clear()
      .moveTo(0, 0)
      .lineTo(0, PIECE_RADIUS)
      .stroke({ color: orthoColor, width: 4, cap: "round" });
    this.rod.rotation = coords.phi;
    this.rod.scale.y = Math.sin(coords.theta);
  }

  flip() {
    [this.base, this.ortho] = [this.ortho, this.base];
    this.draw();
  }

  static random() {
    return new MeasurementPiece(randomQubit());
  }
}
