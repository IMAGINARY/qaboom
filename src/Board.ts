import { Container, Graphics, Point, Ticker } from "pixi.js";
import QubitPiece from "./QubitPiece";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_SIZE,
  PIECE_RADIUS,
} from "./constants";
import { range, uniqWith } from "lodash-es";
import type { Piece } from "./Deck";
import GameNode from "./GameNode";
import { applyGate, getBlochCoords, measure, type Qubit } from "./quantum";
import { getColor, getSecondaryColor } from "./colors";
import { container, delay } from "./util";
import { DOWN, neighbors, orthoNeighbors, RIGHT, UP } from "./points";
import MeasurementPiece from "./MeasurementPiece";
import { sounds } from "./audio";
import QubitPair from "./QubitPair";
import GatePiece from "./GatePiece";

export const startingCell = new Point(Math.floor(BOARD_WIDTH / 2 - 1), 0);
const RECT_MARGIN = PIECE_RADIUS / 2;

export default class Board extends GameNode {
  grid: (QubitPiece | null)[][] = [];
  lines: Container;

  // Either a pair of qubit, a gate, or a measurement
  current: Piece | null = null;
  currentPosition = startingCell;

  constructor() {
    super();
    this.grid = this.initGrid();
    this.view.addChild(
      container(
        new Graphics().roundRect(
          -RECT_MARGIN,
          -RECT_MARGIN,
          BOARD_WIDTH * CELL_SIZE + 2 * RECT_MARGIN,
          BOARD_HEIGHT * CELL_SIZE + 2 * RECT_MARGIN,
          RECT_MARGIN
        )
      )
    );
    this.lines = new Container();
    this.view.addChild(this.lines);
  }

  tick(time: Ticker) {
    this.current?.tick(time);
    for (const row of this.grid) {
      for (const piece of row) {
        if (piece) {
          piece.tick(time);
        }
      }
    }
  }

  initGrid() {
    const grid = [];
    for (let i = 0; i < BOARD_HEIGHT; i++) {
      grid.push(range(BOARD_WIDTH).map(() => null));
    }
    return grid;
  }

  getPiece(point: Point) {
    if (!inBounds(point)) {
      return null;
    }
    return this.grid[point.y][point.x];
  }

  setPiece(point: Point, value: QubitPiece | null, remove = true) {
    // remove the previous item from the grid.
    const prevValue = this.grid[point.y][point.x];
    if (prevValue && remove) {
      this.view.removeChild(prevValue.view);
    }

    this.grid[point.y][point.x] = value;
    if (value) {
      if (value.view.parent !== this.view) {
        this.view.addChild(value.view);
      }
      value.view.position = this.gridToLocal(point);
    }
  }

  containsPoint(p: Point) {
    if (!inBounds(p)) return false;
    return !!this.getPiece(p);
  }

  // Whether the cell is a valid empty cell in the grid
  isEmptyCell(p: Point) {
    return inBounds(p) && !this.getPiece(p);
  }

  setCurrentPosition(p: Point) {
    this.currentPosition = p;
    this.current!.view.position = this.gridToLocal(this.currentPosition);
  }

  gridToLocal(p: Point) {
    return {
      x: (p.x + 0.5) * CELL_SIZE,
      y: (p.y + 0.5) * CELL_SIZE,
    };
  }

  drawLine(p1: Point, p2: Point, value: Qubit) {
    const { phi, theta } = getBlochCoords(value);
    const pos1 = this.gridToLocal(p1);
    const pos2 = this.gridToLocal(p2);
    this.lines.addChild(
      new Graphics()
        .moveTo(pos1.x, pos1.y)
        .lineTo(pos2.x, pos2.y)
        .stroke({ color: getSecondaryColor({ phi, theta }), width: 10 })
        .moveTo(pos1.x, pos1.y)
        .lineTo(pos2.x, pos2.y)
        .stroke({ color: getColor({ phi, theta }), width: 7.5 })
    );
  }

  // Resolve the current piece action.
  // Return whether the game still continues.
  async resolve(onScore: (score: number) => void) {
    // If it's a pair of qubits, just add it to the grid.
    if (this.current instanceof QubitPair) {
      sounds.set.load();
      sounds.set.volume = 0.5;
      sounds.set.play();
      const secondPosition = this.currentPosition.add(
        this.current.orientation === "vertical" ? UP : RIGHT
      );
      // If the second position of the qubit is higher than the initial position,
      // it's game over.
      if (secondPosition.y < 0) {
        return false;
      }
      this.setPiece(this.currentPosition, this.current.first);
      this.setPiece(secondPosition, this.current.second);
      // If the starting cell is occupied, it's game over.
      if (this.containsPoint(startingCell)) {
        return false;
      }
      await this.fall();
    } else if (this.current instanceof MeasurementPiece) {
      // If it's a measurement, trigger the measurement reaction chain.
      await this.measure(onScore);
    } else if (this.current instanceof GatePiece) {
      // If it's a gate, trigger the gate.
      await this.triggerGate();
    }
    return true;
  }

  async triggerGate() {
    if (!(this.current instanceof GatePiece)) {
      throw new Error("called `triggerGate` without GatePiece");
    }
    sounds.gate.load();
    sounds.gate.play();
    // Apply the gate on the surrounding pieces
    for (let p of neighbors(this.currentPosition)) {
      let piece = this.getPiece(p);
      if (piece) {
        piece.setValue(applyGate(this.current.matrix, piece.value));
        piece.bounce();
      }
    }
    this.view.removeChild(this.current?.view);
  }

  async measure(onScore: (score: number) => void) {
    if (!(this.current instanceof MeasurementPiece)) {
      throw new Error("Attempting to measure without a MeasurementPiece");
    }
    let measureCount = 0;
    let measureQueue = [this.currentPosition];
    const measuredQubits = [];
    let newMeasures = false;
    let visited: Point[] = [];
    do {
      let newQueue: Point[] = [];
      let scoreToAdd = 0;
      const current = this.current;
      newMeasures = false;
      for (const point of measureQueue) {
        for (const nbr of orthoNeighbors(point)) {
          if (visited.some((p) => p.equals(nbr))) {
            continue;
          }
          const qubit = this.getPiece(nbr);
          if (!qubit) continue;
          newMeasures = true;
          visited.push(nbr);
          const measured = measure(qubit.value, current.base);
          if (measured) {
            qubit.setValue(current.base);
            this.drawLine(point, nbr, current.base);
            qubit.bounce();
            measuredQubits.push(nbr);
            scoreToAdd += measuredQubits.length;
            newQueue.push(nbr);
          } else {
            this.drawLine(point, nbr, current.ortho);
            qubit.setValue(current.ortho);
            qubit.bounceIn();
          }
        }
      }
      if (newMeasures) {
        const scoreSound =
          sounds.score[Math.min(measureCount, sounds.score.length - 1)];
        scoreSound.load();
        scoreSound.play();
        measureCount++;
        measureQueue = uniqWith(newQueue, (a, b) => a.equals(b));
        onScore(scoreToAdd);
        await delay(350);
      }
    } while (newMeasures);

    const uniqMeasured = uniqWith(measuredQubits, (a, b) => a.equals(b));
    if (uniqMeasured.length > 0) {
      sounds.clear.load();
      sounds.clear.play();
    }
    let score = 0;
    score += triangular(uniqMeasured.length);
    const removedPieces: QubitPiece[] = [];
    for (const point of uniqMeasured) {
      const piece = this.getPiece(point);
      if (piece) {
        removedPieces.push(piece);
      }
      this.setPiece(point, null, false);
    }
    this.view.removeChild(this.current.view);
    this.lines.removeChildren();
    await Promise.all(removedPieces.map((piece) => piece?.destroy()));
    for (const piece of removedPieces) {
      this.view.removeChild(piece.view);
    }
    await this.fall();
  }

  async fall() {
    let anyFalling = false;
    do {
      anyFalling = false;
      for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = BOARD_HEIGHT - 2; y >= 0; y--) {
          const point = new Point(x, y);
          if (
            this.containsPoint(point) &&
            !this.containsPoint(point.add(DOWN))
          ) {
            const piece = this.getPiece(point);
            this.setPiece(point, null);
            this.setPiece(point.add(DOWN), piece);
            anyFalling = true;
          }
        }
      }
      await delay(150);
    } while (anyFalling);
  }
}

export function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}

function triangular(n: number) {
  return (n * (n - 1)) / 2;
}
