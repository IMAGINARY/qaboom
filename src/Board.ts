import { Container, Point } from "pixi.js";
import Qubit from "./Qubit";
import { range } from "lodash-es";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
// The "game board": the currently existing grid of qubits.
export default class Board {
  view: Container;
  grid: (Qubit | null)[][] = range(BOARD_HEIGHT).map(() =>
    range(BOARD_WIDTH).map(() => null)
  );
  // Either a pair of qubit, a gate, or a measurement
  current: Qubit | null = null;
  currentPosition = new Point(Math.floor(BOARD_WIDTH / 2), 0);

  constructor() {
    this.view = new Container();
    // Initialize the positions of the qubits based on the level.
  }

  step() {
    // If no currnet piece present, deal from the deck.

    // If it doesn't touch the floor or another qubit in the grid,
    // move it down.
    const occupiedBelow =
      !!this.grid[this.currentPosition.y + 1][this.currentPosition.x];
    if (this.currentPosition.y + 1 < BOARD_HEIGHT && !occupiedBelow) {
      this.currentPosition.y += 1;
      return;
    }

    // If it's a pair of qubits, just add it to the grid.
    if (this.current instanceof Qubit) {
      this.grid[this.currentPosition.y][this.currentPosition.x] = this.current;
    }
    // If it's a gate, trigger the gate.
    // If it's a measurement, trigger the measurement reaction chain.
  }

  onPlayerInput() {
    // If the player presses the trigger, rotate the qubit (if possible)
    // If the player presses left or right, move the current item (if possible)
    // If the player presses down, speed up the steps
  }
}
