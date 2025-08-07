import { Graphics } from "pixi.js";
import { PIECE_RADIUS } from "./constants";
import { choice } from "./random";
import { getColor } from "./colors";
import { rotateXGate, rotateYGate, rotateZGate } from "./quantum";

type Axis = "X" | "Y" | "Z";

// A piece representing a (1-qubit) gate
export default class GatePiece {
  angle: number;
  axis: Axis;
  sprite: Graphics;

  constructor(axis: Axis, angle: number) {
    this.axis = axis;
    this.angle = angle;
    this.sprite = new Graphics();
    for (let i = 0; i < 8; i++) {
      let angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
      this.sprite
        .moveTo(0, 0)
        .arc(
          0,
          0,
          PIECE_RADIUS * (2 / 3),
          angle - Math.PI / 8,
          angle + Math.PI / 8
          // true
        )
        .fill(colorMap[this.axis][i]);
    }

    this.sprite
      .arc(0, 0, PIECE_RADIUS, -Math.PI / 2, -Math.PI / 2 + angle, angle < 0)
      .lineTo(0, 0)
      .stroke({ color: "white", width: 2 });
  }

  get matrix() {
    return matrices[this.axis](this.angle);
  }

  static random() {
    return new GatePiece(
      choice<Axis>(["Z"]),
      choice([Math.PI / 2, Math.PI, (Math.PI * 3) / 2])
    );
  }
}

const colors = {
  black: getColor({ phi: 0, theta: 0 }),
  white: getColor({ phi: 0, theta: Math.PI }),
  // Primary band
  red: getColor({ phi: 0, theta: Math.PI / 2 }),
  yellow: getColor({ phi: Math.PI / 2, theta: Math.PI / 2 }),
  green: getColor({ phi: Math.PI, theta: Math.PI / 2 }),
  blue: getColor({ phi: (3 * Math.PI) / 2, theta: Math.PI / 2 }),
  // Secondary colors
  orange: getColor({ phi: (1 / 4) * Math.PI, theta: Math.PI / 2 }),
  lime: getColor({ phi: (3 / 4) * Math.PI, theta: Math.PI / 2 }),
  teal: getColor({ phi: (5 / 4) * Math.PI, theta: Math.PI / 2 }),
  purple: getColor({ phi: (7 / 4) * Math.PI, theta: Math.PI / 2 }),
  // Shades
  dark_red: getColor({ phi: 0, theta: (1 / 4) * Math.PI }),
  dark_yellow: getColor({ phi: Math.PI / 2, theta: (1 / 4) * Math.PI }),
  dark_green: getColor({ phi: Math.PI, theta: (1 / 4) * Math.PI }),
  dark_blue: getColor({ phi: (3 * Math.PI) / 2, theta: (1 / 4) * Math.PI }),
  // Tints
  light_red: getColor({ phi: 0, theta: (3 / 4) * Math.PI }),
  light_yellow: getColor({ phi: Math.PI / 2, theta: (3 / 4) * Math.PI }),
  light_green: getColor({ phi: Math.PI, theta: (3 / 4) * Math.PI }),
  light_blue: getColor({ phi: (3 * Math.PI) / 2, theta: (3 / 4) * Math.PI }),
};

const colorMap = {
  X: [
    colors.black,
    colors.dark_yellow,
    colors.yellow,
    colors.light_yellow,
    colors.white,
    colors.light_blue,
    colors.blue,
    colors.dark_blue,
  ],
  Y: [
    colors.black,
    colors.dark_red,
    colors.red,
    colors.light_red,
    colors.white,
    colors.light_green,
    colors.green,
    colors.dark_green,
  ],
  Z: [
    colors.red,
    colors.orange,
    colors.yellow,
    colors.lime,
    colors.green,
    colors.teal,
    colors.blue,
    colors.purple,
  ],
};

const matrices = {
  X: rotateXGate,
  Y: rotateYGate,
  Z: rotateZGate,
};
