import { Container, Graphics, GraphicsContext, Point, Ticker } from "pixi.js";
import "pixi.js/math-extras";
import QubitPiece from "./QubitPiece";
import { range, uniqWith } from "lodash-es";
import MeasurementPiece from "./MeasurementPiece";
import { measure } from "./quantum";
import { DOWN, neighbors } from "./points";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 25;
const RATE = 1000;
const MEASURE_RATE = 250;

type State = "game" | "measure";
// The "game board": the currently existing grid of qubits.
export default class Board {
  view: Container;
  grid: (QubitPiece | null)[][];
  // Either a pair of qubit, a gate, or a measurement
  current: QubitPiece | MeasurementPiece | null = null;
  currentPosition = new Point(Math.floor(BOARD_WIDTH / 2), 0);
  currentState: State = "game";

  // State relating to measurement
  measureQueue: Point[] = [];
  measured: Point[] = [];
  visited: Point[] = [];

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
    const fillHeight = 0;
    const grid = [];
    for (let i = 0; i < BOARD_HEIGHT - fillHeight; i++) {
      grid.push(range(BOARD_WIDTH).map(() => null));
    }
    for (let i = BOARD_HEIGHT - fillHeight; i < BOARD_HEIGHT; i++) {
      const row = [];
      for (let j = 0; j < BOARD_WIDTH; j++) {
        const qubit = QubitPiece.random();
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

  getPiece(point: Point) {
    return this.grid[point.y][point.x];
  }

  setPiece(point: Point, value: QubitPiece | null) {
    this.grid[point.y][point.x] = value;
  }

  tick(time: Ticker) {
    if (this.time >= this.nextTime) {
      if (this.currentState === "game") {
        this.step();
        this.nextTime += RATE;
      } else {
        this.measureStep();
        this.nextTime += MEASURE_RATE;
      }
    }
    this.time += time.deltaMS;
  }

  step() {
    // If it doesn't touch the floor or another qubit in the grid,
    // move it down.
    const occupiedBelow =
      this.currentPosition.y + 1 === BOARD_HEIGHT ||
      !!this.getPiece(this.currentPosition.add(DOWN));
    if (!occupiedBelow) {
      this.updateCurrent(this.currentPosition.add(new Point(0, 1)));
      return;
    }

    // If it's a pair of qubits, just add it to the grid.
    if (this.current instanceof QubitPiece) {
      this.grid[this.currentPosition.y][this.currentPosition.x] = this.current;
      this.newCurrent();
    } else if (this.current instanceof MeasurementPiece) {
      // If it's a measurement, trigger the measurement reaction chain.
      this.currentState = "measure";
      this.measureQueue = neighbors(this.currentPosition).filter((p) =>
        this.containsPoint(p)
      );
      this.measureStep();
    }
    // If it's a gate, trigger the gate.
  }

  measureStep() {
    if (this.measureQueue.length === 0) {
      this.fall();
      return;
    }
    let newQueue: Point[] = [];
    const current = this.current as MeasurementPiece;
    this.visited = this.visited.concat(this.measureQueue);
    for (const point of this.measureQueue) {
      const qubit = this.getPiece(point);
      if (!qubit) continue;
      const measured = measure(qubit.value, current.base);
      if (measured) {
        qubit.setValue(current.base);
        this.measured.push(point);
        // Add unvisited neighbors to the new queue.
        for (const nbr of neighbors(point)) {
          if (inBounds(nbr) && !this.visited.some((p) => p.equals(nbr))) {
            newQueue.push(nbr);
          }
        }
      } else {
        qubit.setValue(current.ortho);
      }
    }
    this.measureQueue = uniqWith(newQueue, (a, b) => a.equals(b));
  }

  fall() {
    for (const point of uniqWith(this.measured, (a, b) => a.equals(b))) {
      this.view.removeChild(this.getPiece(point)!.sprite);
      this.setPiece(point, null);
    }
    this.measured = [];
    this.measureQueue = [];
    this.visited = [];
    this.currentState = "game";
    this.view.removeChild(this.current!.sprite);
    this.newCurrent();
  }

  newCurrent() {
    if (Math.random() < 1 / 4) {
      this.current = MeasurementPiece.random();
    } else {
      this.current = QubitPiece.random();
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
    if (!inBounds(p)) return false;
    return !!this.getPiece(p);
  }

  handleKeyInput(e: KeyboardEvent) {
    if (this.currentState !== "game") {
      return;
    }
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

function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}
