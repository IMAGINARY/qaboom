export function floatEquals(a: number, b: number, precision = 2 ** -5) {
  return Math.abs(a - b) < precision;
}

export function floatGreaterThan(a: number, b: number, precision = 2 ** -5) {
  return a > b || floatEquals(a, b, precision);
}
