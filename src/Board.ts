import { Container, Graphics, GraphicsContext, Point } from "pixi.js";
import QubitPiece from "./QubitPiece";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_SIZE,
  INIT_FILL_HEIGHT,
} from "./constants";
import { range } from "lodash-es";

export default class Board {
  view: Container;
  grid: (QubitPiece | null)[][] = [];

  constructor() {
    this.view = new Container();
    this.grid = this.initGrid();
    this.view.addChild(
      new Graphics(
        new GraphicsContext()
          .rect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE)
          .stroke("white")
      )
    );
  }

  initialize() {
    this.grid = this.initGrid();
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
      value.sprite.position.x = (point.x + 0.5) * CELL_SIZE;
      value.sprite.position.y = (point.y + 0.5) * CELL_SIZE;
    }
  }

  containsPoint(p: Point) {
    if (!inBounds(p)) return false;
    return !!this.getPiece(p);
  }
}

export function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}
