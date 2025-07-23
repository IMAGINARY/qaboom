// A qubit is the basic "piece" that exists in the grid.
// It has a 3D rotation and amplitude, which are represented in 2D
// using colors.
export default class Qubit {
  // The qubit value
  value: any;

  constructor() {}

  // return a random qubit
  static random() {
    return new Qubit();
  }
}
