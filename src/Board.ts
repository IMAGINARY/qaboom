import { Container, Graphics, GraphicsContext, Point, Ticker } from "pixi.js";
import "pixi.js/math-extras";
import Qubit from "./Qubit";
import { range } from "lodash-es";
import Measurement from "./Measurement";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 25;
const RATE = 1000;
// The "game board": the currently existing grid of qubits.
export default class Board {
  view: Container;
  grid: (Qubit | null)[][];
  // Either a pair of qubit, a gate, or a measurement
  current: Qubit | Measurement | null = null;
  currentPosition = new Point(Math.floor(BOARD_WIDTH / 2), 0);

  time: number = 0;
  nextTime: number = 0;

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
    this.newCurrent();

    document.addEventListener("keydown", (e) => this.handleKeyInput(e));
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

  tick(time: Ticker) {
    if (this.time >= this.nextTime) {
      this.step();
      this.nextTime += RATE;
    }
    this.time += time.deltaMS;
  }

  step() {
    // If it doesn't touch the floor or another qubit in the grid,
    // move it down.
    const occupiedBelow =
      !!this.grid[this.currentPosition.y + 1][this.currentPosition.x];
    if (this.currentPosition.y + 1 < BOARD_HEIGHT && !occupiedBelow) {
      this.updateCurrent(this.currentPosition.add(new Point(0, 1)));
      return;
    }

    // If it's a pair of qubits, just add it to the grid.
    if (this.current instanceof Qubit) {
      this.grid[this.currentPosition.y][this.currentPosition.x] = this.current;
      this.newCurrent();
    } else if (this.current instanceof Measurement) {
      // If it's a measurement, trigger the measurement reaction chain.
      // TODO
    }
    // If it's a gate, trigger the gate.
  }

  newCurrent() {
    if (Math.random() < 1 / 8) {
      this.current = Measurement.random();
    } else {
      this.current = Qubit.random();
    }
    this.updateCurrent(new Point(Math.min(BOARD_WIDTH / 2), 0));
    this.view.addChild(this.current.sprite);
  }

  updateCurrent(p: Point) {
    // if (!this.current) return;
    this.currentPosition = p;
    this.current!.sprite.position = {
      x: (this.currentPosition.x + 0.5) * CELL_SIZE,
      y: (this.currentPosition.y + 0.5) * CELL_SIZE,
    };
  }

  containsPoint(p: Point) {
    return !!this.grid[p.y][p.x];
  }

  handleKeyInput(e: KeyboardEvent) {
    switch (e.key) {
      // If the player presses left or right, move the current item (if possible)
      case "ArrowLeft": {
        const left = this.currentPosition.add(new Point(-1, 0));
        if (!this.containsPoint(left) && left.x >= 0) {
          this.updateCurrent(left);
        }
        break;
      }
      case "ArrowRight": {
        const right = this.currentPosition.add(new Point(1, 0));
        if (!this.containsPoint(right) && right.x < BOARD_WIDTH) {
          this.updateCurrent(right);
        }
        break;
      }
      case "ArrowDown": {
        const down = this.currentPosition.add(new Point(0, 1));
        if (!this.containsPoint(down) && down.y < BOARD_HEIGHT) {
          this.updateCurrent(down);
        }
        break;
      }
    }
    // If the player presses the trigger, rotate the qubit (if possible)
    // If the player presses down, speed up the steps
  }
}
