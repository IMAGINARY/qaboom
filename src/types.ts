import type { Container, Ticker } from "pixi.js";
import type MeasurementPiece from "./MeasurementPiece";
import type GatePiece from "./GatePiece";

export interface BaseQubit {
  sprite: Container;
  tick(time: Ticker): void;
  measure(measurement: MeasurementPiece): boolean;
  applyGate(gate: GatePiece): void;
}
