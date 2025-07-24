import { Container, Graphics, GraphicsContext, Point, Ticker } from "pixi.js";
import "pixi.js/math-extras";
import QubitPiece from "./QubitPiece";
import { range, uniqWith } from "lodash-es";
import MeasurementPiece from "./MeasurementPiece";
import { measure } from "./quantum";
import { DOWN, neighbors, RIGHT, UP } from "./points";
import { CELL_SIZE } from "./constants";
import Deck from "./Deck";
import QubitPair from "./QubitPair";

const BOARD_WIDTH = 6;
const BOARD_HEIGHT = 12;
const INIT_FILL_HEIGHT = 0;

type State = "game" | "measure" | "fall";

const RATES = {
  game: 750,
  measure: 150,
  fall: 150,
};
// The "game board": the currently existing grid of qubits.
export default class Board {
  view: Container;
  grid: (QubitPiece | null)[][];
  deck: Deck;
  // Either a pair of qubit, a gate, or a measurement
  current: QubitPair | MeasurementPiece | null = null;
  currentPosition = new Point(Math.floor(BOARD_WIDTH / 2 - 1), 0);
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
    this.deck = new Deck();
    this.view.addChild(this.deck.view);

    this.grid = this.initGrid();
    this.newCurrent();

    document.addEventListener("keydown", (e) => this.handleKeyInput(e));
  }

  initGrid() {
    const grid = [];
    for (let i = 0; i < BOARD_HEIGHT - INIT_FILL_HEIGHT; i++) {
      grid.push(range(BOARD_WIDTH).map(() => null));
    }
    for (let i = BOARD_HEIGHT - INIT_FILL_HEIGHT; i < BOARD_HEIGHT; i++) {
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
    if (value) {
      value.sprite.position.x = (point.x + 0.5) * CELL_SIZE;
      value.sprite.position.y = (point.y + 0.5) * CELL_SIZE;
    }
  }

  tick(time: Ticker) {
    if (this.time >= this.nextTime) {
      if (this.currentState === "game") {
        this.step();
      } else if (this.currentState === "measure") {
        this.measureStep();
      } else {
        this.fallStep();
      }
      this.nextTime = this.time + RATES[this.currentState];
    }
    this.time += time.deltaMS;
  }

  step() {
    // If it doesn't touch the floor or another qubit in the grid,
    // move it down.
    const occupiedBelow =
      this.currentPosition.y + 1 === BOARD_HEIGHT ||
      !!this.getPiece(this.currentPosition.add(DOWN)) ||
      (this.current instanceof QubitPair &&
        this.current.orientation === "horizontal" &&
        !!this.getPiece(this.currentPosition.add(RIGHT).add(DOWN)));

    if (!occupiedBelow) {
      this.updateCurrent(this.currentPosition.add(DOWN));
      return;
    }
    this.resolve();
  }

  // Resolve the current piece's action when it can't move any more.
  resolve() {
    // If it's a pair of qubits, just add it to the grid.
    if (this.current instanceof QubitPair) {
      this.view.addChild(this.current.first.sprite);
      this.view.addChild(this.current.second.sprite);
      this.setPiece(this.currentPosition, this.current.first);
      this.setPiece(
        this.currentPosition.add(
          this.current.orientation === "vertical" ? UP : RIGHT
        ),
        this.current.second
      );
      // this.newCurrent();
      this.currentState = "fall";
    } else if (this.current instanceof MeasurementPiece) {
      // If it's a measurement, trigger the measurement reaction chain.
      this.currentState = "measure";
      this.measureQueue = neighbors(this.currentPosition).filter((p) =>
        this.containsPoint(p)
      );
    }
    // If it's a gate, trigger the gate.
  }

  measureStep() {
    if (this.measureQueue.length === 0) {
      this.resolveMeasurement();
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

  resolveMeasurement() {
    for (const point of uniqWith(this.measured, (a, b) => a.equals(b))) {
      this.view.removeChild(this.getPiece(point)!.sprite);
      this.setPiece(point, null);
    }
    this.measured = [];
    this.measureQueue = [];
    this.visited = [];
    this.view.removeChild(this.current!.sprite);
    this.currentState = "fall";
  }

  fallStep() {
    let anyFalling = false;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = BOARD_HEIGHT - 2; y >= 0; y--) {
        const point = new Point(x, y);
        if (this.containsPoint(point) && !this.containsPoint(point.add(DOWN))) {
          const piece = this.getPiece(point);
          this.setPiece(point, null);
          this.setPiece(point.add(DOWN), piece);
          anyFalling = true;
        }
      }
    }
    if (!anyFalling) {
      this.currentState = "game";
      this.newCurrent();
    }
  }

  newCurrent() {
    this.current = this.deck.pop();
    this.updateCurrent(new Point(Math.min(BOARD_WIDTH / 2 - 1), 0));
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
      case "a":
      case "ArrowLeft": {
        const left = this.currentPosition.add(new Point(-1, 0));
        if (this.containsPoint(left)) break;
        if (left.x < 0) break;
        if (
          this.current instanceof QubitPair &&
          this.current.orientation === "vertical" &&
          this.containsPoint(left.add(UP))
        )
          break;
        this.updateCurrent(left);
        break;
      }
      case "d":
      case "ArrowRight": {
        const right = this.currentPosition.add(RIGHT);
        if (this.containsPoint(right)) break;
        if (right.x >= BOARD_WIDTH) break;
        if (this.current instanceof QubitPair) {
          if (
            this.current.orientation === "vertical" &&
            this.containsPoint(right.add(UP))
          ) {
            break;
          }
          const right2 = right.add(RIGHT);
          if (
            this.current.orientation === "horizontal" &&
            (this.containsPoint(right2) || right2.x >= BOARD_WIDTH)
          )
            break;
        }
        this.updateCurrent(right);
        break;
      }
      case "s":
      case "ArrowDown": {
        let obstructed = false;
        const down = this.currentPosition.add(DOWN);
        if (this.containsPoint(down)) obstructed = true;
        if (down.y >= BOARD_HEIGHT) obstructed = true;
        if (
          this.current instanceof QubitPair &&
          this.current.orientation === "horizontal" &&
          this.containsPoint(down.add(RIGHT))
        ) {
          obstructed = true;
        }

        if (obstructed) {
          this.resolve();
        } else {
          this.updateCurrent(down);
        }
        break;
      }
      // If the player presses the trigger, rotate the qubit (if possible)
      case " ": {
        // Can only rotate qubit pairs
        if (!(this.current instanceof QubitPair)) {
          break;
        }
        if (this.current.orientation === "vertical") {
          const right = this.currentPosition.add(RIGHT);
          if (this.containsPoint(right) || !inBounds(right)) {
            break;
          }
        }
        if (this.current.orientation === "horizontal") {
          if (this.containsPoint(this.currentPosition.add(UP))) {
            break;
          }
        }
        this.current.rotate();
        break;
      }
    }

    // If the player presses down, speed up the steps
  }
}

function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}
