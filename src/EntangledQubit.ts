import * as math from "mathjs";
import { Graphics, type Container } from "pixi.js";
import type { BaseQubit } from "./types";
import type GatePiece from "./GatePiece";
import { PIECE_RADIUS } from "./constants";
import type EntangledPair from "./EntangledPair";

export default class EntangledQubit implements BaseQubit {
  sprite: Container;
  parent?: EntangledPair;

  constructor() {
    this.sprite = new Graphics().circle(0, 0, PIECE_RADIUS).fill("grey");
  }

  tick() {}

  measure() {
    // We're assuming completely entangled states, which always have a 50/50 chance
    return Math.random() < 1 / 2;
  }

  applyGate(gate: GatePiece): void {
    if (!this.parent) {
      throw new Error("No parent found.");
    }
    let fullGate;
    if (this === this.parent.first) {
      fullGate = math.kron(gate.matrix, math.identity(2) as math.Matrix);
    } else {
      fullGate = math.kron(math.identity(2) as math.Matrix, gate.matrix);
    }
    this.parent.value = math.multiply(fullGate, this.parent.value);
  }
}
