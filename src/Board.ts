import { Container, Graphics, GraphicsContext, Point } from "pixi.js";
import Qubit from "./Qubit";
import { range } from "lodash-es";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 25;
// The "game board": the currently existing grid of qubits.
export default class Board {
  view: Container;
  grid: (Qubit | null)[][];
  // Either a pair of qubit, a gate, or a measurement
  current: Qubit | null = null;
  currentPosition = new Point(Math.floor(BOARD_WIDTH / 2), 0);

  constructor() {
    this.view = new Container();
    this.view.position = { x: 50, y: 50 };
    this.view.addChild(
      new Graphics(
        new GraphicsContext()
          .rect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE)
          .stroke("white")
      )
    );
    this.grid = this.initGrid();
    // Initialize the positions of the qubits based on the level.
  }

  initGrid() {
    const fillHeight = 8;
    const grid = [];
    for (let i = 0; i < BOARD_HEIGHT - fillHeight; i++) {
      grid.push(range(BOARD_WIDTH).map(() => null));
    }
    for (let i = BOARD_HEIGHT - fillHeight; i < BOARD_HEIGHT; i++) {
      const row = [];
      for (let j = 0; j < BOARD_WIDTH; j++) {
        const qubit = Qubit.random();
        qubit.sprite.position = new Point(
          (j + 0.5) * CELL_SIZE,
          (i + 0.5) * CELL_SIZE
        );
        this.view.addChild(qubit.sprite);
        row.push(qubit);
      }
      grid.push(row);
    }
    return grid;
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
