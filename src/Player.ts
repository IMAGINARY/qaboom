import { HTMLText, Point, Ticker, type PointData } from "pixi.js";
import "pixi.js/math-extras";
import { uniqWith } from "lodash-es";
import MeasurementPiece from "./MeasurementPiece";
import { applyGate, measure } from "./quantum";
import { DOWN, LEFT, neighbors, orthoNeighbors, RIGHT, UP } from "./points";
import { CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import Deck, { type Piece } from "./Deck";
import QubitPair from "./QubitPair";
import Board, { inBounds, startingCell } from "./Board";
import GatePiece from "./GatePiece";
import { sounds } from "./audio";
import levels from "./levels";
import GameNode from "./GameNode";

type State = "game" | "measure" | "fall";
type Input = "left" | "right" | "down" | "rotate";
type InputMap = Record<string, Input>;

const MAX_MULTIPLIER = 1 / 5;

const RATES = {
  game: 500,
  measure: 350,
  fall: 250,
};

const rateMultiplier = 0.9;
const levelCount = 20;

interface Options {
  position: PointData;
  inputMap: InputMap;
}

/**
 * The board and deck for a single player.
 */
export default class Player extends GameNode {
  onGameOver?: () => void;

  board: Board;
  deck: Deck;
  scoreboard: HTMLText;
  levelSign: HTMLText;

  hold: Piece | null = null;
  canSwap = true;

  currentState: State = "game";
  #score: number = 0;

  // Level related
  #level = 0;
  rateMultiplier = 1;
  pieceCount = 0;

  // State relating to measurement
  measureQueue: Point[] = [];
  measured: Point[] = [];
  measureCount = 0;
  visited: Point[] = [];

  time: number = 0;
  nextTime: number = 0;
  inputMap: InputMap;

  constructor({ position, inputMap }: Options) {
    super();
    // TODO be able to reference the "current" position based on the board.
    this.view.position = position;
    this.inputMap = inputMap;

    this.board = new Board();
    this.board.view.position = { x: 50, y: 50 };
    this.view.addChild(this.board.view);

    this.deck = new Deck(levels[0].deal);
    this.deck.view.position = { x: 50 + BOARD_WIDTH * CELL_SIZE + 20, y: 50 };
    this.deck.view.scale = 0.75;
    this.view.addChild(this.deck.view);

    this.scoreboard = new HTMLText({
      text: "" + this.score,
      style: {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 28,
      },
    });
    this.scoreboard.position = { x: 475, y: 10 };
    this.scoreboard.anchor = { x: 1, y: 0 };
    this.view.addChild(this.scoreboard);

    this.levelSign = new HTMLText({
      text: "Lvl " + (this.level + 1),
      style: {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 28,
      },
    });
    this.levelSign.position = { x: 50, y: 10 };
    this.view.addChild(this.levelSign);

    this.newCurrent();
  }

  get level() {
    return this.#level;
  }
  set level(value: number) {
    this.#level = value;
    this.levelSign.text = `Lvl ${this.#level + 1}`;
  }

  get score() {
    return this.#score;
  }

  set score(value: number) {
    this.#score = value;
    this.scoreboard.text = `${this.#score * 100}`;
  }

  show() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  hide() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  tick = (time: Ticker) => {
    this.board.tick(time);
    this.deck.tick(time);
    if (this.time >= this.nextTime) {
      if (this.currentState === "game") {
        this.step();
      } else if (this.currentState === "measure") {
        this.measureStep();
      } else {
        this.fallStep();
      }
      const multiplier = this.currentState === "game" ? this.rateMultiplier : 1;
      this.nextTime = this.time + RATES[this.currentState] * multiplier;
    }
    this.time += time.deltaMS;
  };

  step() {
    // If it doesn't touch the floor or another qubit in the grid,
    // move it down.
    const occupiedBelow =
      this.board.currentPosition.y + 1 === BOARD_HEIGHT ||
      !!this.board.getPiece(this.board.currentPosition.add(DOWN)) ||
      (this.board.current instanceof QubitPair &&
        this.board.current.orientation === "horizontal" &&
        !!this.board.getPiece(this.board.currentPosition.add(RIGHT).add(DOWN)));

    if (occupiedBelow) {
      this.resolve();
    } else {
      this.board.setCurrentPosition(this.board.currentPosition.add(DOWN));
    }
  }

  // Resolve the current piece's action when it can't move any more.
  resolve() {
    // If it's a pair of qubits, just add it to the grid.
    if (this.board.current instanceof QubitPair) {
      sounds.set.load();
      sounds.set.volume = 0.5;
      sounds.set.play();
      const secondPosition = this.board.currentPosition.add(
        this.board.current.orientation === "vertical" ? UP : RIGHT
      );
      // If the second position of the qubit is higher than the initial position,
      // it's game over.
      if (secondPosition.y < 0) {
        this.onGameOver?.();
        return;
      }
      this.board.setPiece(this.board.currentPosition, this.board.current.first);
      this.board.setPiece(secondPosition, this.board.current.second);
      // If the starting cell is occupied, it's game over.
      if (this.board.containsPoint(startingCell)) {
        this.onGameOver?.();
        return;
      }
      this.currentState = "fall";
    } else if (this.board.current instanceof MeasurementPiece) {
      // If it's a measurement, trigger the measurement reaction chain.
      this.currentState = "measure";
      this.measureQueue = orthoNeighbors(this.board.currentPosition).filter(
        (p) => this.board.containsPoint(p)
      );
      for (let nbr of this.measureQueue) {
        this.board.drawLine(this.board.currentPosition, nbr);
      }
    } else if (this.board.current instanceof GatePiece) {
      // If it's a gate, trigger the gate.
      this.triggerGate();
    }
  }

  measureStep() {
    if (!(this.board.current instanceof MeasurementPiece)) {
      throw new Error("Called `measureStep` without a MeasurementPiece");
    }
    if (this.measureQueue.length === 0) {
      this.resolveMeasurement();
      return;
    }
    let newQueue: Point[] = [];
    const current = this.board.current;
    this.visited = this.visited.concat(this.measureQueue);
    const scoreSound =
      sounds.score[Math.min(this.measureCount, sounds.score.length - 1)];
    scoreSound.load();
    scoreSound.play();
    for (const point of this.measureQueue) {
      const qubit = this.board.getPiece(point);
      if (!qubit) continue;
      const measured = measure(qubit.value, current.base);
      if (measured) {
        qubit.setValue(current.base);
        this.measured.push(point);
        // Add unvisited neighbors to the new queue.
        for (const nbr of orthoNeighbors(point)) {
          if (
            inBounds(nbr) &&
            this.board.containsPoint(nbr) &&
            !this.visited.some((p) => p.equals(nbr))
          ) {
            newQueue.push(nbr);
            this.board.drawLine(point, nbr);
          }
        }
      } else {
        qubit.setValue(current.ortho);
      }
    }
    this.measureCount++;
    this.measureQueue = uniqWith(newQueue, (a, b) => a.equals(b));
  }

  resolveMeasurement() {
    const uniqMeasured = uniqWith(this.measured, (a, b) => a.equals(b));
    if (uniqMeasured.length > 0) {
      sounds.clear.load();
      sounds.clear.play();
    }
    this.score += triangular(uniqMeasured.length);
    for (const point of uniqMeasured) {
      this.board.setPiece(point, null);
    }
    this.measured = [];
    this.measureQueue = [];
    this.visited = [];
    this.measureCount = 0;
    this.board.view.removeChild(this.board.current!.view);
    this.currentState = "fall";
    this.board.lines.removeChildren();
  }

  fallStep() {
    let anyFalling = false;
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = BOARD_HEIGHT - 2; y >= 0; y--) {
        const point = new Point(x, y);
        if (
          this.board.containsPoint(point) &&
          !this.board.containsPoint(point.add(DOWN))
        ) {
          const piece = this.board.getPiece(point);
          this.board.setPiece(point, null);
          this.board.setPiece(point.add(DOWN), piece);
          anyFalling = true;
        }
      }
    }
    if (!anyFalling) {
      this.currentState = "game";
      this.newCurrent();
    }
  }

  triggerGate() {
    if (!(this.board.current instanceof GatePiece)) {
      throw new Error("called `triggerGate` without GatePiece");
    }
    sounds.gate.load();
    sounds.gate.play();
    // Apply the gate on the surrounding pieces
    for (let p of neighbors(this.board.currentPosition)) {
      let piece = this.board.getPiece(p);
      if (piece) {
        piece.setValue(applyGate(this.board.current.matrix, piece.value));
      }
    }
    this.currentState = "game";
    this.board.view.removeChild(this.board.current?.view);
    this.newCurrent();
  }

  newCurrent() {
    this.pieceCount++;
    // Increase level
    if (this.pieceCount > levelCount) {
      this.level++;
      sounds.levelUp.load();
      sounds.levelUp.play();
      this.pieceCount = 0;
      if (this.level > levels.length - 1) {
        this.rateMultiplier *= rateMultiplier;
        this.rateMultiplier = Math.max(this.rateMultiplier, MAX_MULTIPLIER);
      } else {
        this.deck.deal = levels[this.level].deal;
      }
    }
    this.canSwap = true;
    this.board.current = this.deck.pop();
    this.board.setCurrentPosition(startingCell);
    this.board.view.addChild(this.board.current.view);
  }

  swap() {
    this.canSwap = false;
    sounds.swap.load();
    sounds.swap.play();
    [this.board.current, this.hold] = [this.hold, this.board.current];
    if (!this.board.current) {
      this.newCurrent();
    }
    this.board.setCurrentPosition(startingCell);
    if (this.hold) {
      this.hold.view.position = { x: 400, y: 600 };
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (this.currentState !== "game") {
      return;
    }
    switch (this.inputMap[e.key]) {
      // If the player presses left or right, move the current item (if possible)
      case "left": {
        const left = this.board.currentPosition.add(LEFT);
        if (!this.board.isEmptyCell(left)) break;
        if (
          this.board.current instanceof QubitPair &&
          this.board.current.orientation === "vertical" &&
          this.board.containsPoint(left.add(UP))
        )
          break;
        this.board.setCurrentPosition(left);
        sounds.move.load();
        sounds.move.play();
        break;
      }
      case "right": {
        const right = this.board.currentPosition.add(RIGHT);
        if (!this.board.isEmptyCell(right)) break;
        if (this.board.current instanceof QubitPair) {
          if (
            this.board.current.orientation === "vertical" &&
            this.board.containsPoint(right.add(UP))
          ) {
            break;
          }
          const right2 = right.add(RIGHT);
          if (
            this.board.current.orientation === "horizontal" &&
            (this.board.containsPoint(right2) || right2.x >= BOARD_WIDTH)
          )
            break;
        }
        this.board.setCurrentPosition(right);
        sounds.move.load();
        sounds.move.play();
        break;
      }
      // If the player presses down, speed up the steps
      case "down": {
        let obstructed = false;
        const down = this.board.currentPosition.add(DOWN);
        if (this.board.containsPoint(down)) obstructed = true;
        if (down.y >= BOARD_HEIGHT) obstructed = true;
        if (
          this.board.current instanceof QubitPair &&
          this.board.current.orientation === "horizontal" &&
          this.board.containsPoint(down.add(RIGHT))
        ) {
          obstructed = true;
        }

        if (obstructed) {
          this.resolve();
        } else {
          // sounds.move.load();
          // sounds.move.play();
          this.board.setCurrentPosition(down);
        }
        break;
      }
      // case "w":
      // case "ArrowUp": {
      //   // if (this.canSwap) {
      //   //   this.swap();
      //   // }
      //   break;
      // }
      // If the player presses the trigger, rotate the qubit (if possible)
      case "rotate": {
        // Can only rotate qubit pairs
        if (this.board.current instanceof MeasurementPiece) {
          this.board.current.flip();
          sounds.turn.load();
          sounds.turn.play();
          break;
        } else if (this.board.current instanceof GatePiece) {
          this.board.current.rotate();
          sounds.turn.load();
          sounds.turn.play();
          break;
        } else if (this.board.current instanceof QubitPair) {
          if (this.board.current.orientation === "vertical") {
            const right = this.board.currentPosition.add(RIGHT);
            if (this.board.containsPoint(right) || !inBounds(right)) {
              // "Kick back" if we're against the wall
              if (
                this.board.isEmptyCell(this.board.currentPosition.add(LEFT))
              ) {
                this.board.setCurrentPosition(
                  this.board.currentPosition.add(LEFT)
                );
              } else if (
                this.board.isEmptyCell(
                  this.board.currentPosition.add(LEFT).add(UP)
                )
              ) {
                this.board.setCurrentPosition(
                  this.board.currentPosition.add(LEFT).add(UP)
                );
              } else {
                break;
              }
            }
          }
          if (this.board.current.orientation === "horizontal") {
            if (this.board.containsPoint(this.board.currentPosition.add(UP))) {
              break;
            }
          }
          this.board.current.rotate();
          sounds.turn.load();
          sounds.turn.play();
        }
        break;
      }
    }
  };
}

function triangular(n: number) {
  return (n * (n - 1)) / 2;
}
