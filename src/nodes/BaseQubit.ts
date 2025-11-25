import { Container, type Ticker } from "pixi.js";
import type MeasurementPiece from "./MeasurementPiece";
import type GatePiece from "./GatePiece";
import GameNode from "./GameNode";
import { pulse } from "../animations";

export default abstract class BaseQubit extends GameNode {
  // Container for internal stuff for animation;
  container: Container;

  constructor() {
    super();
    this.container = new Container();
  }

  abstract tick(time: Ticker): void;
  abstract measure(measurement: MeasurementPiece): boolean;
  abstract applyGate(gate: GatePiece): void;
  abstract destroy(): void;

  bounce() {
    pulse(this.container);
  }

  bounceIn() {
    pulse(this.container, 0.85);
  }
}
