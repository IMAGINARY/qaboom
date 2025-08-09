import * as math from "mathjs";
import { choice } from "./random";

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
  return choice([ZERO, ONE, PLUS, MINUS, PLUS_I, MINUS_I]);
  // https://mathworld.wolfram.com/SpherePointPicking.html
  const u = Math.random();
  const v = Math.random();
  const phi = 2 * Math.PI * u;
  const theta = Math.acos(2 * v - 1);
  return qubitFromSpherical({ theta, phi });
}

// A matrix representing a turn of theta over the x axis
export function rotateXGate(theta: number) {
  return math.matrix([
    [math.complex(Math.cos(theta / 2)), math.complex(0, -Math.sin(theta / 2))],
    [math.complex(0, -Math.sin(theta / 2)), math.complex(Math.cos(theta / 2))],
  ]);
}

// A matrix representing a turn of theta over the y axis
export function rotateYGate(theta: number) {
  return math.matrix([
    [math.complex(Math.cos(theta / 2)), math.complex(-Math.sin(theta / 2))],
    [math.complex(Math.sin(theta / 2)), math.complex(Math.cos(theta / 2))],
  ]);
}

// A matrix representing a turn of theta over the z axis
export function rotateZGate(theta: number) {
  return math.matrix([
    [math.exp(math.complex(0, -theta / 2)), 0],
    [0, math.exp(math.complex(0, theta / 2))],
  ]);
}

export function measure(qubit: Qubit, base: Qubit) {
  const prob = (math.dot(base, qubit) as any).toPolar().r ** 2;
  return Math.random() < prob;
}
