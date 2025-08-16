import { Container, Graphics, Ticker } from "pixi.js";
import { PIECE_RADIUS, theme } from "../constants";
import { choice } from "../random";
import { getColor } from "../colors";
import { getBlochCoords, octet, rotationGate, type Axis } from "../quantum";
import GameNode from "./GameNode";

const rotationSpeed = Math.PI / 16;

// A piece representing a (1-qubit) gate
export default class GatePiece extends GameNode {
  angle: number;
  axis: Axis;
  background: Graphics;
  angleMarker: Graphics;

  constructor(axis: Axis, angle: number) {
    super();
    this.axis = axis;
    this.angle = angle;
    this.view = new Container();
    this.angleMarker = new Graphics();
    this.background = new Graphics();
    const colorMap = octet(axis);
    for (let i = 0; i < 8; i++) {
      let angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
      this.background
        .moveTo(0, 0)
        .arc(
          0,
          0,
          PIECE_RADIUS * (2 / 3),
          angle - Math.PI / 8,
          angle + Math.PI / 8
          // true
        )
        .fill(getColor(getBlochCoords(colorMap[i])));
    }
    this.view.addChild(this.background);
    this.view.addChild(this.angleMarker);
    this.drawAngle();
  }

  get matrix() {
    return rotationGate(this.axis, this.angle);
  }

  static random() {
    return new GatePiece(
      choice<Axis>(["X", "Y", "Z"]),
      choice([Math.PI / 2, Math.PI, (Math.PI * 3) / 2])
    );
  }

  tick(time: Ticker) {
    this.background.rotation += (time.deltaMS * rotationSpeed) / 1000;
  }

  rotate() {
    this.angle = (this.angle + Math.PI / 2) % (2 * Math.PI);
    this.drawAngle();
  }

  drawAngle() {
    this.angleMarker
      .clear()
      .arc(
        0,
        0,
        PIECE_RADIUS,
        -Math.PI / 2,
        -Math.PI / 2 + this.angle,
        this.angle < 0
      )
      .lineTo(0, 0)
      .stroke({ color: theme.colors.primary, width: 2 });
  }
}
