import * as math from "mathjs";
import { Graphics } from "pixi.js";
import { PIECE_RADIUS } from "./constants";
import { choice } from "./random";
import { getColor } from "./colors";
// A piece representing a (1-qubit) gate
export default class GatePiece {
  matrix: math.Matrix;
  sprite: Graphics;

  constructor({ matrix, colors, angle }: any) {
    this.matrix = matrix;
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
        .fill(colors[i]);
    }

    this.sprite
      .arc(0, 0, PIECE_RADIUS, -Math.PI / 2, -Math.PI / 2 + angle, angle < 0)
      .lineTo(0, 0)
      .stroke({ color: "white", width: 2 });
  }

  static random() {
    return new GatePiece(choice(gates));
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

const colorsX = [
  colors.white,
  colors.light_yellow,
  colors.yellow,
  colors.dark_yellow,
  colors.black,
  colors.dark_blue,
  colors.blue,
  colors.light_blue,
];

const colorsY = [
  colors.white,
  colors.light_red,
  colors.red,
  colors.dark_red,
  colors.black,
  colors.dark_green,
  colors.green,
  colors.light_green,
];

const colorsZ = [
  colors.red,
  colors.orange,
  colors.yellow,
  colors.lime,
  colors.green,
  colors.teal,
  colors.blue,
  colors.purple,
];

const gates = [
  {
    name: "X",
    matrix: math.matrix([
      [math.complex(0), math.complex(1)],
      [math.complex(1), math.complex(0)],
    ]),
    angle: Math.PI,
    colors: colorsX,
  },
  {
    name: "Y",
    matrix: math.matrix([
      [math.complex(0), math.complex(0, -1)],
      [math.complex(0, 1), math.complex(0)],
    ]),
    angle: Math.PI,
    colors: colorsY,
  },
  {
    name: "Z",
    matrix: math.matrix([
      [math.complex(1), math.complex(0)],
      [math.complex(0), math.complex(-1)],
    ]),
    angle: Math.PI,
    colors: colorsZ,
  },
  // {
  //   name: "√X",
  //   matrix: math.multiply(
  //     math.matrix([
  //       [math.complex(1, 1), math.complex(1, -1)],
  //       [math.complex(1, -1), math.complex(1, 1)],
  //     ]),
  //     1 / 2
  //   ),
  //   angle: Math.PI / 2,
  //   colors: colorsX,
  // },
  // {
  //   name: "√X^-1",
  //   matrix: math.inv(
  //     math.multiply(
  //       math.matrix([
  //         [math.complex(1, 1), math.complex(1, -1)],
  //         [math.complex(1, -1), math.complex(1, 1)],
  //       ]),
  //       1 / 2
  //     )
  //   ),
  //   angle: -Math.PI / 2,
  //   colors: colorsX,
  // },
  // {
  //   name: "√Z",
  //   matrix: math.matrix([
  //     [math.complex(1), math.complex(0)],
  //     [math.complex(0), math.complex(0, 1)],
  //   ]),
  //   angle: Math.PI / 2,
  //   colors: colorsZ,
  // },
  // {
  //   name: "√Z^-1",
  //   matrix: math.inv(
  //     math.matrix([
  //       [math.complex(1), math.complex(0)],
  //       [math.complex(0), math.complex(0, 1)],
  //     ])
  //   ),
  //   angle: -Math.PI / 2,
  //   colors: colorsZ,
  // },
  // {
  //   name: "H",
  //   matrix: math.multiply(
  //     math.matrix([
  //       [math.complex(1), math.complex(1)],
  //       [math.complex(1), math.complex(-1)],
  //     ]),
  //     1 / Math.sqrt(2)
  //   ),
  // },
  // {
];
