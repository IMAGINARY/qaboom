import { range } from "lodash-es";
import QubitPair from "./nodes/QubitPair";
import GatePiece from "./nodes/GatePiece";
import MeasurementPiece from "./nodes/MeasurementPiece";
import { choice, shuffle } from "./random";
import {
  ONE,
  ZERO,
  type Axis,
  octet,
  quartet,
  type Qubit,
  randomQubit,
  qubitBases,
  secondaryQubits,
} from "./quantum";
import type { Piece } from "./nodes/Deck";

export interface Level {
  randomQubit: () => Qubit;
  deal: () => Piece[];
  scoreBase: number;
}

// TODO use this for more balanced dealing?
export function* getCombos<T>(array: T[]) {
  for (let i = 0; i < array.length; i++) {
    for (let j = i; j < array.length; j++) {
      yield [array[i], array[j]];
    }
  }
}

const gateRotations = [Math.PI / 2, Math.PI, Math.PI * (3 / 2)];

function primaryLevel(axis: Axis): Level {
  return {
    scoreBase: 100,
    randomQubit: () => choice(quartet(axis)),
    deal: () => {
      const random = () => choice(quartet(axis));
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      for (let _i of range(2)) {
        buffer.push(new GatePiece(axis, choice(gateRotations)));
      }
      buffer.push(new MeasurementPiece(random()));
      return shuffle(buffer);
    },
  };
}

// The primary stage of the campaign, only dealing with basis qubit states
export const primaryLevels: Level[] = [
  primaryLevel("X"),
  primaryLevel("Y"),
  primaryLevel("Z"),
  {
    scoreBase: 150,
    randomQubit: () => choice(qubitBases),
    deal: () => {
      const random = () => choice(qubitBases);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      for (let _i of range(2)) {
        buffer.push(
          new GatePiece(choice(["X", "Y", "Z"]), choice(gateRotations))
        );
      }
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
];

function secondaryLevel(axis: Axis): Level {
  return {
    scoreBase: 250,
    randomQubit: () => choice(octet(axis)),
    deal: () => {
      const random = () => choice(octet(axis));
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      for (let _i of range(2)) {
        buffer.push(new GatePiece(axis, choice(gateRotations)));
      }
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  };
}

// The second stage of the campaign, dealing with all secondary colors
export const secondaryLevels: Level[] = [
  secondaryLevel("X"),
  secondaryLevel("Y"),
  secondaryLevel("Z"),
  {
    scoreBase: 300,
    randomQubit: () => choice(secondaryQubits),
    deal: () => {
      const random = () => choice(secondaryQubits);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      for (let _i of range(2)) {
        buffer.push(
          new GatePiece(choice(["X", "Y", "Z"]), choice(gateRotations))
        );
      }
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
];

export const freeMode: Level = {
  scoreBase: 500,
  randomQubit: () => randomQubit(),
  deal: () => {
    let buffer = [];
    for (let _i of range(5)) {
      buffer.push(QubitPair.random());
    }
    for (let _i of range(2)) {
      buffer.push(GatePiece.random());
    }
    for (let _i of range(1)) {
      buffer.push(MeasurementPiece.random());
    }
    return shuffle(buffer);
  },
};

export const campaign: Level[] = [
  {
    scoreBase: 50,
    randomQubit: () => choice([ZERO, ONE]),
    deal: () => {
      const random = () => choice([ZERO, ONE]);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
  ...primaryLevels,
  ...secondaryLevels,
  freeMode,
];
