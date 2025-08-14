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
} from "./quantum";
import type { Piece } from "./Deck";

export interface Level {
  deal: () => Piece[];
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

export const secondaryColors: Level[] = [
  {
    deal: () => {
      const qubits = range(0, 8).map((theta) => {
        return applyGate(rotateXGate((theta * Math.PI) / 4), ZERO);
      });
      const random = () => choice(qubits);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece("X", Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
  {
    deal: () => {
      const qubits = range(0, 8).map((theta) => {
        return applyGate(rotateYGate((theta * Math.PI) / 4), ZERO);
      });
      const random = () => choice(qubits);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece("Y", Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
  {
    deal: () => {
      const qubits = range(0, 8).map((theta) => {
        return applyGate(rotateZGate((theta * Math.PI) / 4), PLUS);
      });
      const random = () => choice(qubits);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece("Z", Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
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
      buffer.push(new GatePiece(choice(["X", "Y", "Z"]), Math.PI));
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
  {
    deal: () => {
      const random = () => choice([ZERO, ONE, PLUS_I, MINUS_I]);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece("X", Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
  {
    deal: () => {
      const random = () => choice([ZERO, ONE, PLUS, MINUS]);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece("Y", Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
  {
    deal: () => {
      const random = () => choice([PLUS, MINUS, PLUS_I, MINUS_I]);
      let buffer = [];
      for (let _i of range(5)) {
        buffer.push(new QubitPair(random(), random()));
      }
      buffer.push(new GatePiece("Z", Math.PI));
      buffer.push(new MeasurementPiece(random()));
      return buffer;
    },
  },
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
  ...secondaryColors,
  freeMode,
];
