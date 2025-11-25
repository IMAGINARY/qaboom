import {
  Container,
  Graphics,
  HTMLText,
  Point,
  TextStyle,
  Ticker,
} from "pixi.js";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL_SIZE,
  PIECE_RADIUS,
  TEXT_FONT,
  theme,
} from "../constants";
import { range, uniqWith } from "lodash-es";
import type { Piece } from "./Deck";
import GameNode from "./GameNode";
import { getBlochCoords, type Qubit } from "../quantum";
import { getColor, getSecondaryColor } from "../colors";
import { container, delay } from "../util";
import { DOWN, neighbors, orthoNeighbors, RIGHT, UP } from "../points";
import MeasurementPiece from "./MeasurementPiece";
import { playScoreSound, playSound } from "../audio";
import QubitPair from "./QubitPair";
import GatePiece from "./GatePiece";
import { animate } from "motion";
import { setI18nKey } from "../i18n";
import BaseQubit from "./BaseQubit";
import EntanglerPiece from "./EntanglerPiece";

export const startingCell = new Point(Math.floor(BOARD_WIDTH / 2 - 1), 0);
const RECT_MARGIN = PIECE_RADIUS / 2;

export default class Board extends GameNode {
  grid: (BaseQubit | null)[][] = [];
  lines: Container;
  validCells: Point[] = [];

  // Either a pair of qubit, a gate, or a measurement
  current: Piece | null = null;
  currentPosition = startingCell;
  currentEntanglerLine: Graphics;

  constructor() {
    super();
    this.grid = this.initGrid();
    this.currentEntanglerLine = new Graphics();
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
    this.view.addChild(this.currentEntanglerLine);
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

  setPiece(point: Point, value: BaseQubit | null, remove = true) {
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

  // Returns whether the board is completely empty
  isEmpty() {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (this.containsPoint(new Point(x, y))) {
          return false;
        }
      }
    }
    return true;
  }

  // Whether the cell is a valid empty cell in the grid
  isEmptyCell(p: Point) {
    return inBounds(p) && !this.getPiece(p);
  }

  setCurrentPosition(p: Point) {
    this.currentPosition = p;
    this.current!.view.position = this.gridToLocal(this.currentPosition);
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

  drawEntanglerLine(p1: Point, p2: Point) {
    const pos1 = this.gridToLocal(p1);
    const pos2 = this.gridToLocal(p2);
    this.currentEntanglerLine
      .clear()
      .moveTo(pos1.x, pos1.y)
      .lineTo(pos2.x, pos2.y)
      .stroke({ color: "white", width: 3 });
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
  async resolve(scoreMult: number, onScore: (score: number) => void) {
    // If it's a pair of qubits, just add it to the grid.
    if (this.current instanceof QubitPair) {
      playSound("set");
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
      await this.measure(scoreMult, onScore);
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
    playSound("gate");
    // Apply the gate on the surrounding pieces
    for (let p of neighbors(this.currentPosition)) {
      let piece = this.getPiece(p);
      if (piece) {
        piece.applyGate(this.current);
        piece.bounce();
      }
    }
    this.view.removeChild(this.current?.view);
  }

  async measure(scoreMult: number, onScore: (score: number) => void) {
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
          const measured = qubit.measure(current);
          if (measured) {
            this.drawLine(point, nbr, current.base);
            qubit.bounce();
            measuredQubits.push(nbr);
            const score = measuredQubits.length * scoreMult;
            this.pingScore(nbr, measuredQubits.length, scoreMult);
            scoreToAdd += score;
            newQueue.push(nbr);
          } else {
            this.drawLine(point, nbr, current.ortho);
            qubit.bounceIn();
          }
        }
      }
      if (newMeasures) {
        playScoreSound(measureCount);
        measureCount++;
        measureQueue = uniqWith(newQueue, (a, b) => a.equals(b));
        onScore(scoreToAdd);
        await delay(350);
      }
    } while (newMeasures);

    const uniqMeasured = uniqWith(measuredQubits, (a, b) => a.equals(b));
    let score = 0;
    score += triangular(uniqMeasured.length);
    const removedPieces: BaseQubit[] = [];
    for (const point of uniqMeasured) {
      const piece = this.getPiece(point);
      if (piece) {
        removedPieces.push(piece);
      }
      this.setPiece(point, null, false);
    }
    if (uniqMeasured.length > 0) {
      playSound("clear");
      this.showBoom(uniqMeasured.length);
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
    const promises = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      let gap = 0;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        const point = new Point(x, y);
        const piece = this.getPiece(point)!;
        if (!piece) {
          gap++;
        } else {
          if (gap === 0) {
            continue;
          }
          this.setPiece(point, null, false);
          const currentGap = gap;
          promises.push(
            animate(
              piece.view.position,
              {
                x: piece.view.position.x,
                y: (y + currentGap) * CELL_SIZE,
              },
              { duration: 0.05 * currentGap, ease: "linear" }
            ).then(() => {
              this.setPiece(point.add(DOWN.multiplyScalar(currentGap)), piece);
            })
          );
        }
      }
    }
    await Promise.all(promises);
  }

  async showBoom(count: number) {
    if (!(this.current instanceof MeasurementPiece)) {
      return;
    }
    const boomKey = this.isEmpty()
      ? "all_clear"
      : count >= 15
      ? "large"
      : count >= 6
      ? "medium"
      : "small";
    const text = new HTMLText({
      style: new TextStyle({
        fontSize: Math.min(BOARD_WIDTH * CELL_SIZE * 1.25, 60 + 5 * count),
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fill: theme.colors.primary,
      }),
    });
    setI18nKey(text, `game.boom_text.${boomKey}`);
    // Have the text above everything else
    text.zIndex = 100;
    text.anchor = { x: 0.5, y: 0.5 };
    text.position = {
      x: (BOARD_WIDTH * CELL_SIZE) / 2,
      y: (BOARD_HEIGHT * CELL_SIZE) / 2,
    };
    text.scale = 0;
    // text.position =
    this.view.addChild(text);
    await animate([
      [text.scale, { x: 1.5, y: 1.5 }, { duration: 0.5 }],
      [text.scale, { x: 1, y: 1 }, { duration: 0.5 }],
      [text, { alpha: 0 }, { at: 0.5, duration: 0.5 }],
    ]);
    this.view.removeChild(text);
  }

  async pingScore(position: Point, baseScore: number, multiplier: number) {
    if (!(this.current instanceof MeasurementPiece)) {
      return;
    }
    const coords = getBlochCoords(this.current.base);
    const text = new HTMLText({
      text: `+${baseScore * multiplier}`,
      style: new TextStyle({
        fontSize: 24 + 2 * baseScore,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fill: getColor(coords),
        stroke: { color: getSecondaryColor(coords), width: 4 },
      }),
    });
    text.anchor = { x: 0.5, y: 0.5 };
    text.position = this.gridToLocal(position);
    text.alpha = 0;
    this.view.addChild(text);
    await animate([
      [text.position, { y: text.position.y - CELL_SIZE / 2 }],
      [text, { alpha: 1 }, { at: 0 }],
      [text, { alpha: 0 }, { delay: 0.25 }],
    ]);
    this.view.removeChild(text);
  }
}

export function inBounds(p: Point) {
  return p.x >= 0 && p.x < BOARD_WIDTH && p.y >= 0 && p.y < BOARD_HEIGHT;
}

function triangular(n: number) {
  return (n * (n - 1)) / 2;
}
