import * as math from "mathjs";
declare module "mathjs" {
  export const Complex = {
    fromPolar(theta: number, phi: number): math.Complex;
  }
}
