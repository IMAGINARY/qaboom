import {
  matrix,
  complex,
  divide,
  multiply,
  conj,
  exp,
  dot,
  type Matrix,
  Complex,
} from "mathjs";
// import { choice } from "./random";

// TODO (refactor)
// Create a more type-safe wrapper around mathjs functions.
// There are a lot of "as" casts because the types for mathjs are rather bad
// (e.g. not genericized correctly).
export type Qubit = Matrix<Complex>;
// A 2x2 matrix
export type Gate = Matrix<Complex>;
// Common bases
export const ZERO = matrix<Complex>([complex(1), complex(0)]);
export const ONE = matrix<Complex>([complex(0), complex(1)]);
export const PLUS = matrix<Complex>([
  complex(1 / Math.sqrt(2)),
  complex(1 / Math.sqrt(2)),
]);
export const MINUS = matrix<Complex>([
  complex(1 / Math.sqrt(2)),
  complex(-1 / Math.sqrt(2)),
]);
export const PLUS_I = matrix<Complex>([
  complex(1 / Math.sqrt(2)),
  complex(0, 1 / Math.sqrt(2)),
]);
export const MINUS_I = matrix<Complex>([
  complex(1 / Math.sqrt(2)),
  complex(0, -1 / Math.sqrt(2)),
]);

export function qubitFromSpherical({
  theta,
  phi,
}: {
  theta: number;
  phi: number;
}): Qubit {
  return matrix<Complex>([
    complex(Math.cos(theta / 2)),
    Complex.fromPolar(Math.sin(theta / 2), phi),
  ]);
}

export function getBlochCoords(qubit: Qubit) {
  let alpha = complex(qubit.get([0]));
  let beta = qubit.get([1]);
  let theta = 2 * Math.acos(alpha.toPolar().r);
  let phi = (
    divide(
      multiply(beta, conj(alpha)),
      alpha.toPolar().r * beta.toPolar().r
    ) as Complex
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
  return matrix([
    Math.cos(theta2 / 2),
    multiply(
      complex(Math.sin(theta2 / 2)),
      exp(multiply(complex(0, 1), phi2) as any)
    ) as any,
  ]);
}

export function randomQubit() {
  // return choice([ZERO, ONE, PLUS, MINUS, PLUS_I, MINUS_I]);
  // https://mathworld.wolfram.com/SpherePointPicking.html
  const u = Math.random();
  const v = Math.random();
  const phi = 2 * Math.PI * u;
  const theta = Math.acos(2 * v - 1);
  return qubitFromSpherical({ theta, phi });
}

// A matrix representing a turn of theta over the x axis
export function rotateXGate(theta: number) {
  return matrix<Complex>([
    [complex(Math.cos(theta / 2)), complex(0, -Math.sin(theta / 2))],
    [complex(0, -Math.sin(theta / 2)), complex(Math.cos(theta / 2))],
  ]);
}

// A matrix representing a turn of theta over the y axis
export function rotateYGate(theta: number) {
  return matrix<Complex>([
    [complex(Math.cos(theta / 2)), complex(-Math.sin(theta / 2))],
    [complex(Math.sin(theta / 2)), complex(Math.cos(theta / 2))],
  ]);
}

// A matrix representing a turn of theta over the z axis
export function rotateZGate(theta: number) {
  return matrix<Complex>([
    [exp(complex(0, -theta / 2)), complex(0)],
    [complex(0), exp(complex(0, theta / 2))],
  ]);
}

export function applyGate(gate: Gate, qubit: Qubit) {
  return multiply(gate, qubit) as Qubit;
}

export function measure(qubit: Qubit, base: Qubit) {
  const prob = (dot(base, qubit) as any).toPolar().r ** 2;
  return Math.random() < prob;
}
