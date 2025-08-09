import * as math from "mathjs";
import EntangledQubit from "./EntangledQubit";

export default class EntangledPair {
  first: EntangledQubit;
  second: EntangledQubit;
  value: math.Matrix;

  constructor() {
    this.first = new EntangledQubit();
    this.second = new EntangledQubit();
    this.first.parent = this;
    this.second.parent = this;
    this.value = math.matrix([
      math.complex(1),
      math.complex(0),
      math.complex(0),
      math.complex(1),
    ]);
  }
}
