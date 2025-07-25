import * as math from "mathjs";
import { Graphics, HTMLText } from "pixi.js";
import { PIECE_RADIUS } from "./constants";
import { choice } from "./random";
// A piece representing a (1-qubit) gate
export default class GatePiece {
  matrix: math.Matrix;
  sprite: Graphics;

  constructor(matrix: math.Matrix, name: string) {
    this.matrix = matrix;
    this.sprite = new Graphics().circle(0, 0, PIECE_RADIUS).stroke("white");
    const text = new HTMLText({
      text: name,
      style: {
        align: "center",
        fill: "white",
        fontSize: 24,
      },
    });
    text.anchor = { x: 0.5, y: 0.5 };
    this.sprite.addChild(text);
  }

  static random() {
    const { name, matrix } = choice(gates);
    return new GatePiece(matrix, name);
  }
}

const gates = [
  {
    name: "X",
    matrix: math.matrix([
      [math.complex(0), math.complex(1)],
      [math.complex(1), math.complex(0)],
    ]),
  },
  {
    name: "Z",
    matrix: math.matrix([
      [math.complex(1), math.complex(0)],
      [math.complex(0), math.complex(-1)],
    ]),
  },
  {
    name: "Y",
    matrix: math.matrix([
      [math.complex(0), math.complex(0, -1)],
      [math.complex(0, 1), math.complex(0)],
    ]),
  },
  {
    name: "H",
    matrix: math.multiply(
      math.matrix([
        [math.complex(1), math.complex(1)],
        [math.complex(1), math.complex(-1)],
      ]),
      1 / Math.sqrt(2)
    ),
  },
  {
    name: "S",
    matrix: math.matrix([
      [math.complex(1), math.complex(0)],
      [math.complex(0), math.complex(0, 1)],
    ]),
  },
  {
    name: "T",
    matrix: math.matrix([
      [1, 0],
      [0, (math as any).Complex.fromPolar(1, Math.PI / 4)],
    ]),
  },
  // {
  //   name: "√NOT",
  //   matrix: math.matrix([
  //     [math.complex(1, 1), math.complex(1, -1)],
  //     [math.complex(1, -1), math.complex(1, 1)]
  //   ])
  // }
];
