import * as math from "mathjs";
import { interpolate, formatCss, formatHex } from "culori";

export type Qubit = math.Matrix<math.Complex>;
// Common bases
export const ZERO = math.matrix([math.complex(1), math.complex(0)]);
export const ONE = math.matrix([math.complex(0), math.complex(1)]);
export const PLUS = math.matrix([
  math.complex(1 / Math.sqrt(2)),
  math.complex(1 / Math.sqrt(2)),
]);
export const MINUS = math.matrix([
  math.complex(1 / Math.sqrt(2)),
  math.complex(-1 / Math.sqrt(2)),
]);
export const PLUS_I = math.matrix([
  math.complex(1 / Math.sqrt(2)),
  math.complex(0, 1 / Math.sqrt(2)),
]);
export const MINUS_I = math.matrix([
  math.complex(1 / Math.sqrt(2)),
  math.complex(0, -1 / Math.sqrt(2)),
]);

export function qubitFromSpherical({
  theta,
  phi,
}: {
  theta: number;
  phi: number;
}): Qubit {
  return math.matrix([
    math.complex(Math.cos(theta / 2)),
    (math as any).Complex.fromPolar(Math.sin(theta / 2), phi),
  ]);
}

export function getColor({ phi, theta }: { theta: number; phi: number }) {
  const interpHue = interpolate(
    ["#c40233", "#ffd300", "#009f6b", "#0087bd", "#c40233"],
    "oklch"
  );
  const hue = interpHue(phi / (2 * Math.PI));
  const interpLight = interpolate(["black", formatCss(hue), "white"], "oklch");
  return formatHex(interpLight(theta / Math.PI));
}

export function getBlochCoords(qubit: Qubit) {
  let alpha = math.complex(qubit.get([0]));
  let beta = qubit.get([1]);
  let theta = 2 * Math.acos(alpha.toPolar().r);
  let phi = (
    math.divide(
      math.multiply(beta, math.conj(alpha)),
      alpha.toPolar().r * beta.toPolar().r
    ) as math.Complex
  ).toPolar().phi;
  if (isNaN(phi)) phi = 0;
  if (phi < 0) phi += 2 * Math.PI;
  if (isNaN(theta)) theta = 0;

  return { phi, theta };
}

export function getOrtho(qubit: Qubit) {
  const { phi, theta } = getBlochCoords(qubit);
  const phi2 = phi + Math.PI;
  const theta2 = Math.PI - theta;
  return math.matrix([
    Math.cos(theta2 / 2),
    math.multiply(
      math.complex(Math.sin(theta2 / 2)),
      math.exp(math.multiply(math.complex(0, 1), phi2) as any)
    ) as any,
  ]);
}

export function randomQubit() {
  // https://mathworld.wolfram.com/SpherePointPicking.html
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return qubitFromSpherical({ theta, phi });
}

export function measure(qubit: Qubit, base: Qubit) {
  const prob = (math.dot(base, qubit) as any).toPolar().r ** 2;
  return Math.random() < prob;
}
