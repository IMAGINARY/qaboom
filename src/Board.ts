import { Container, Graphics, GraphicsContext, Point, Ticker } from "pixi.js";
import SingleQubit from "./SingleQubit";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_SIZE,
  INIT_FILL_HEIGHT,
} from "./constants";
import { range } from "lodash-es";
import type { Piece } from "./Deck";
import EntanglerPiece from "./EntanglerPiece";

export const startingCell = new Point(Math.floor(BOARD_WIDTH / 2 - 1), 0);

export default class Board {
  view: Container;
  grid: (SingleQubit | null)[][] = [];
  lines: Container;
  validCells: Point[] = [];

  // Either a pair of qubit, a gate, or a measurement
  current: Piece | null = null;
  currentPosition = startingCell;
  currentEntanglerLine: Graphics;

  constructor() {
    this.view = new Container();
    this.grid = this.initGrid();
    this.lines = new Container();
    this.currentEntanglerLine = new Graphics();
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
    this.view.addChild(this.currentEntanglerLine);
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
        const qubit = SingleQubit.random();
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
    if (!inBounds(point)) {
      return null;
    }
    return this.grid[point.y][point.x];
  }

  setPiece(point: Point, value: SingleQubit | null) {
    // remove the previous item from the grid.
    const prevValue = this.grid[point.y][point.x];
    if (prevValue) {
      this.view.removeChild(prevValue.sprite);
    }

    this.grid[point.y][point.x] = value;
    if (value) {
      if (value.sprite.parent !== this.view) {
        this.view.addChild(value.sprite);
      }
      value.sprite.position = this.gridToLocal(point);
    }

    // Update the list of valid cells
    if (value) {
      this.validCells.push(point);
    } else {
      const index = this.validCells.findIndex((p) => p.equals(point));
      this.validCells.splice(index, 1);
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
    this.current!.sprite.position = this.gridToLocal(this.currentPosition);
    if (this.current instanceof EntanglerPiece) {
      this.drawEntanglerLine(this.currentPosition, this.current.target);
    }
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

  drawEntanglerLine(p1: Point, p2: Point) {
    const pos1 = this.gridToLocal(p1);
    const pos2 = this.gridToLocal(p2);
    this.currentEntanglerLine
      .clear()
      .moveTo(pos1.x, pos1.y)
      .lineTo(pos2.x, pos2.y)
      .stroke({ color: "white", width: 3 });
  }
}

export function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}
