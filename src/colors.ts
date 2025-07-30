import { formatCss, formatHex, interpolate } from "culori";

/**
 * Return the color corresponding to the given phi/theta coordinate.
 */
export function getColor({ phi, theta }: { theta: number; phi: number }) {
  const interpHue = interpolate(
    ["#c40233", "#ffd300", "#009f6b", "#0087bd", "#c40233"],
    "oklch"
  );
  const hue = interpHue(phi / (2 * Math.PI));
  const interpLight = interpolate(["black", formatCss(hue), "white"], "oklch");
  return formatHex(interpLight(theta / Math.PI));
}
