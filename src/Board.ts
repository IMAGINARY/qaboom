import { Container, Graphics, GraphicsContext, Point, Ticker } from "pixi.js";
import QubitPiece from "./QubitPiece";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_SIZE,
  INIT_FILL_HEIGHT,
} from "./constants";
import { range } from "lodash-es";
import type { Piece } from "./Deck";
import GameNode from "./GameNode";

export const startingCell = new Point(Math.floor(BOARD_WIDTH / 2 - 1), 0);

export default class Board extends GameNode {
  grid: (QubitPiece | null)[][] = [];
  lines: Container;

  // Either a pair of qubit, a gate, or a measurement
  current: Piece | null = null;
  currentPosition = startingCell;

  constructor() {
    super();
    this.grid = this.initGrid();
    this.lines = new Container();
  }

  initialize() {
    this.view.removeChildren();
    this.view.addChild(
      new Graphics(
        new GraphicsContext()
          .rect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE)
          .stroke("white")
      )
    );
    this.view.addChild(this.lines);
    this.grid = this.initGrid();
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
    for (let i = 0; i < BOARD_HEIGHT - INIT_FILL_HEIGHT; i++) {
      grid.push(range(BOARD_WIDTH).map(() => null));
    }
    for (let i = BOARD_HEIGHT - INIT_FILL_HEIGHT; i < BOARD_HEIGHT; i++) {
      const row = [];
      for (let j = 0; j < BOARD_WIDTH; j++) {
        const qubit = QubitPiece.random();
        qubit.view.position = new Point(
          (j + 0.5) * CELL_SIZE,
          (i + 0.5) * CELL_SIZE
        );
        this.view.addChild(qubit.view);
        row.push(qubit);
      }
      grid.push(row);
    }
    return grid;
  }

  getPiece(point: Point) {
    if (!inBounds(point)) {
      return null;
    }
    return this.grid[point.y][point.x];
  }

  setPiece(point: Point, value: QubitPiece | null) {
    // remove the previous item from the grid.
    const prevValue = this.grid[point.y][point.x];
    if (prevValue) {
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

  drawLine(p1: Point, p2: Point) {
    const pos1 = this.gridToLocal(p1);
    const pos2 = this.gridToLocal(p2);
    this.lines.addChild(
      new Graphics()
        .moveTo(pos1.x, pos1.y)
        .lineTo(pos2.x, pos2.y)
        .stroke({ color: "white", width: 3 })
    );
  }
}

export function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}
