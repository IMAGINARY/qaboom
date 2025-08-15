import { animate } from "motion";
import type { Container } from "pixi.js";

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
