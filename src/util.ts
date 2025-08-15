import { Graphics, GraphicsContext } from "pixi.js";
import { theme } from "./constants";

export async function delay(time: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function container<T extends Graphics | GraphicsContext>(g: T): T {
  return g
    .fill({ color: theme.colors.background, alpha: 0.5 })
    .stroke({ color: theme.colors.primary, width: 5, alpha: 0.5 }) as T;
}
