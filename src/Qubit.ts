import * as math from "mathjs";
import { GraphicsContext, Graphics } from "pixi.js";
import { interpolate, formatCss, formatHex } from "culori";
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
    return new Qubit(
      qubitFromSpherical({
        theta: Math.PI * Math.random(),
        phi: 2 * Math.PI * Math.random(),
      })
    );
  }
}

function qubitFromSpherical({ theta, phi }: { theta: number; phi: number }) {
  return math.matrix([
    math.complex(Math.cos(theta / 2)),
    (math as any).Complex.fromPolar(Math.sin(theta / 2), phi),
  ]);
}

function getColor({ phi, theta }: { theta: number; phi: number }) {
  const interpHue = interpolate(
    ["#c40233", "#ffd300", "#009f6b", "#0087bd", "#c40233"],
    "oklch"
  );
  const hue = interpHue(phi / (2 * Math.PI));
  const interpLight = interpolate(["black", formatCss(hue), "white"], "oklch");
  return formatHex(interpLight(theta / Math.PI));
}

function getBlochCoords(qubit: math.Matrix) {
  let alpha = qubit.get([0]);
  let beta = qubit.get([1]);
  let theta = 2 * Math.acos(alpha.toPolar().r);
  let phi = (
    math.divide(
      math.multiply(beta, alpha.conjugate()),
      alpha.toPolar().r * beta.toPolar().r
    ) as math.Complex
  ).toPolar().phi;
  if (isNaN(phi)) phi = 0;
  if (phi < 0) phi += 2 * Math.PI;
  if (isNaN(theta)) theta = 0;

  return { phi, theta };
}
