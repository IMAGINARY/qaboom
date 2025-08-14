import { Container, Graphics, GraphicsContext, Point, Ticker } from "pixi.js";
import QubitPiece from "./QubitPiece";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_SIZE,
  PIECE_RADIUS,
} from "./constants";
import { range } from "lodash-es";
import type { Piece } from "./Deck";
import GameNode from "./GameNode";
import { getBlochCoords, type Qubit } from "./quantum";
import { getColor, getSecondaryColor } from "./colors";

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
      new Graphics(
        new GraphicsContext()
          .roundRect(
            -RECT_MARGIN,
            -RECT_MARGIN,
            BOARD_WIDTH * CELL_SIZE + 2 * RECT_MARGIN,
            BOARD_HEIGHT * CELL_SIZE + 2 * RECT_MARGIN,
            RECT_MARGIN
          )
          .fill({ color: "black", alpha: 0.5 })
          .stroke("white")
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
}

export function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}
