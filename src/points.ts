import { Point } from "pixi.js";
import "pixi.js/math-extras";

export function neighbors(p: Point) {
  return [p.add(UP), p.add(DOWN), p.add(LEFT), p.add(RIGHT)];
}

export const UP = new Point(0, -1);
export const DOWN = new Point(0, 1);
export const LEFT = new Point(-1, 0);
export const RIGHT = new Point(1, 0);
