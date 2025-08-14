import { range } from "lodash-es";
import QubitPair from "./QubitPair";
import GatePiece from "./GatePiece";
import MeasurementPiece from "./MeasurementPiece";
import { choice, shuffle } from "./random";
import {
  PLUS,
  MINUS,
  ONE,
  ZERO,
  PLUS_I,
  MINUS_I,
  applyGate,
  rotateXGate,
  rotateYGate,
  rotateZGate,
  type Axis,
  octet,
  quartet,
} from "./quantum";
import type { Piece } from "./Deck";

export interface Level {
  deal: () => Piece[];
}

// TODO use this for more balanced dealing?
export function* getCombos<T>(array: T[]) {
  for (let i = 0; i < array.length; i++) {
    for (let j = i; j < array.length; j++) {
      yield [array[i], array[j]];
    }
  }
}

export const freeMode: Level = {
  deal: () => {
    let buffer = [];
    for (let _i of range(4)) {
      buffer.push(QubitPair.random());
    }
    buffer.push(GatePiece.random());
    for (let _i of range(1)) {
      buffer.push(MeasurementPiece.random());
    }
    return shuffle(buffer);
  },
};

function primaryLevel(axis: Axis): Level {
  return {
    deal: () => {
      const qubits = quartet(axis);
      let buffer = [];
      for (let [a, b] of getCombos(qubits)) {
        buffer.push(new QubitPair(a, b));
      }
      for (let _i of range(2)) {
        buffer.push(
          new GatePiece(axis, choice([Math.PI / 2, Math.PI, (Math.PI * 3) / 2]))
        );
      }
      buffer.push(new MeasurementPiece(qubits[0]));
      buffer.push(new MeasurementPiece(qubits[1]));
      return buffer;
    },
  };
}

function secondaryLevel(axis: Axis): Level {
  return {
    deal: () => {
      const random = () => choice(octet(axis));
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece(axis, Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  };
}

// The primary stage of the campaign, only dealing with basis qubit states
export const primaryLevels: Level[] = [
  primaryLevel("X"),
  primaryLevel("Y"),
  primaryLevel("Z"),
  {
    deal: () => {
      const random = () => choice([ZERO, ONE, PLUS, MINUS, PLUS_I, MINUS_I]);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece(choice(["X", "Y", "Z"]), Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
];

// The second stage of the campaign, dealing with all secondary colors
export const secondaryLevels: Level[] = [
  secondaryLevel("X"),
  secondaryLevel("Y"),
  secondaryLevel("Z"),
  {
    deal: () => {
      const qubits = [
        ZERO,
        ONE,
        PLUS,
        MINUS,
        PLUS_I,
        MINUS_I,
        ...range(0, 4).map((theta) => {
          return applyGate(
            rotateXGate((theta * Math.PI) / 2 + Math.PI / 4),
            ZERO
          );
        }),
        ...range(0, 4).map((theta) => {
          return applyGate(
            rotateYGate((theta * Math.PI) / 2 + Math.PI / 4),
            ZERO
          );
        }),
        ...range(0, 4).map((theta) => {
          return applyGate(
            rotateZGate((theta * Math.PI) / 2 + Math.PI / 4),
            PLUS
          );
        }),
      ];
      const random = () => choice(qubits);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(
        new GatePiece(
          choice(["X", "Y", "Z"]),
          choice([Math.PI / 2, Math.PI, Math.PI * (3 / 2)])
        )
      );
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
];

// export const campaign = [freeMode];
// export const campaign = secondaryColors;
export const campaign: Level[] = [
  {
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
