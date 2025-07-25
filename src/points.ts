import { Point } from "pixi.js";
import "pixi.js/math-extras";

export function orthoNeighbors(p: Point) {
  return [p.add(UP), p.add(DOWN), p.add(LEFT), p.add(RIGHT)];
}

export function neighbors(p: Point) {
  return [
    p.add(UP),
    p.add(UP).add(RIGHT),
    p.add(RIGHT),
    p.add(RIGHT).add(DOWN),
    p.add(DOWN),
    p.add(DOWN).add(LEFT),
    p.add(LEFT),
    p.add(LEFT).add(UP),
  ];
}

export const UP = new Point(0, -1);
export const DOWN = new Point(0, 1);
export const LEFT = new Point(-1, 0);
export const RIGHT = new Point(1, 0);
