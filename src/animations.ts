import { animate } from "motion";
import type { Container, Point } from "pixi.js";
import { WIDTH } from "./constants";

export async function pulse(obj: Container, amount: number = 1.15) {
  await animate([
    [
      obj.scale,
      { x: amount, y: amount },
      { duration: 0.15, ease: "easeInOut" },
    ],
    [obj.scale, { x: 1, y: 1 }, { duration: 0.15, ease: "easeInOut" }],
  ]);
}

export async function slideIn(
  obj: Container,
  position: Point,
  direction: Point
) {
  obj.position = position.add(direction.multiplyScalar(WIDTH));
  obj.alpha = 0;
  await animate([
    [obj.position, { ...position }, { duration: 1, ease: "easeOut" }],
    [obj, { alpha: 1 }, { at: 0, duration: 1 }],
  ]);
}

export async function bump(obj: Container, direction: Point, amount: number) {
  await animate(obj.position, direction.multiplyScalar(amount), {
    duration: 0.05,
    ease: "easeIn",
  });
  await animate(
    obj.position,
    { x: 0, y: 0 },
    { duration: 0.1, ease: "easeOut" }
  );
}

export async function bumpRotate(obj: Container) {
  await animate(
    obj,
    { rotation: Math.PI / 16 },
    {
      duration: 0.05,
      ease: "easeIn",
    }
  );
  await animate(obj, { rotation: 0 }, { duration: 0.1, ease: "easeOut" });
}
