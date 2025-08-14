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
import { type Level } from "./levels";
import GameNode from "./GameNode";
import { animate } from "motion";
import type { PlayerInput } from "./inputs";

type State = "game" | "measure" | "fall" | "game_over";

const MAX_MULTIPLIER = 1 / 5;

const INPUT_POLL_RATE = 100;
const RATES = {
  game: 500,
  measure: 350,
  fall: 250,
  game_over: 0,
};

const rateMultiplier = 0.9;
const levelCount = 20;

interface Options {
  levels: Level[];
  position: PointData;
  inputMap: PlayerInput;
}

/**
 * The board and deck for a single player.
 */
export default class Player extends GameNode {
  onGameOver?: (score: number) => void;
  pressedKeys: Record<string, number> = {};

  levels: Level[];
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
  inputMap: PlayerInput;
  keyDelays: Record<string, number> = {};

  constructor({ position, inputMap, levels }: Options) {
    super();
    // TODO be able to reference the "current" position based on the board.
    this.inputMap = inputMap;
    this.keyDelays = {
      [this.inputMap.left]: 300,
      [this.inputMap.right]: 300,
      [this.inputMap.down]: INPUT_POLL_RATE,
    };

    this.levels = levels;
    this.board = new Board();
    this.board.view.position = { x: 50, y: 50 };
    this.view.addChild(this.board.view);

    this.deck = new Deck(levels[this.level].deal);
    this.deck.view.position = { x: 50 + BOARD_WIDTH * CELL_SIZE + 35, y: 50 };
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
    this.scoreboard.position = { x: 475, y: 5 };
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
    this.levelSign.position = { x: 50, y: 5 };
    this.view.addChild(this.levelSign);

    this.view.pivot.set(this.view.width / 2, this.view.height / 2);
    this.view.position = new Point(
      position.x + this.view.width / 2,
      position.y + this.view.height / 2
    );

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
    document.addEventListener("keyup", this.handleKeyUp);
  }

  hide() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  tick = (time: Ticker) => {
    if (this.currentState === "game_over") {
      return;
    }
    for (let key of [
      this.inputMap.left,
      this.inputMap.right,
      this.inputMap.down,
    ]) {
      if (this.time >= this.pressedKeys[key]) {
        this.onPress(key);
        this.pressedKeys[key] += INPUT_POLL_RATE;
      }
    }
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
        this.gameOver();
        return;
      }
      this.board.setPiece(this.board.currentPosition, this.board.current.first);
      this.board.setPiece(secondPosition, this.board.current.second);
      // If the starting cell is occupied, it's game over.
      if (this.board.containsPoint(startingCell)) {
        this.gameOver();
        return;
      }
      this.currentState = "fall";
    } else if (this.board.current instanceof MeasurementPiece) {
      // If it's a measurement, trigger the measurement reaction chain.
      this.currentState = "measure";
      this.measureQueue = [this.board.currentPosition];
    } else if (this.board.current instanceof GatePiece) {
      // If it's a gate, trigger the gate.
      this.triggerGate();
    }
  }

  gameOver() {
    this.currentState = "game_over";
    sounds.gameOver.load();
    sounds.gameOver.play();
    this.shake().then(() => {
      this.onGameOver?.(this.score);
    });
  }

  measureStep() {
    if (!(this.board.current instanceof MeasurementPiece)) {
      throw new Error("Called `measureStep` without a MeasurementPiece");
    }
    // if (this.measureQueue.length === 0) {
    //   this.resolveMeasurement();
    //   return;
    // }
    let newQueue: Point[] = [];
    const current = this.board.current;
    let newMeasures = false;
    for (const point of this.measureQueue) {
      for (const nbr of orthoNeighbors(point)) {
        if (this.visited.some((p) => p.equals(nbr))) {
          continue;
        }
        const qubit = this.board.getPiece(nbr);
        if (!qubit) continue;
        newMeasures = true;
        this.visited.push(nbr);
        const measured = measure(qubit.value, current.base);
        if (measured) {
          qubit.setValue(current.base);
          this.board.drawLine(point, nbr, current.base);
          qubit.bounce();
          this.measured.push(nbr);
          newQueue.push(nbr);
        } else {
          this.board.drawLine(point, nbr, current.ortho);
          qubit.setValue(current.ortho);
          qubit.shake();
        }
      }
    }

    if (newMeasures) {
      const scoreSound =
        sounds.score[Math.min(this.measureCount, sounds.score.length - 1)];
      scoreSound.load();
      scoreSound.play();
      this.measureCount++;
      this.measureQueue = uniqWith(newQueue, (a, b) => a.equals(b));
    } else {
      this.resolveMeasurement();
    }
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
        piece.bounce();
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
      if (this.level > this.levels.length - 1) {
        this.rateMultiplier *= rateMultiplier;
        this.rateMultiplier = Math.max(this.rateMultiplier, MAX_MULTIPLIER);
      } else {
        this.deck.deal = this.levels[this.level].deal;
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
    this.onPress(e.key);
    if (
      [this.inputMap.left, this.inputMap.right, this.inputMap.down].includes(
        e.key
      )
    ) {
      this.pressedKeys[e.key] = this.time + this.keyDelays[e.key];
    }
  };

  handleKeyUp = (e: KeyboardEvent) => {
    delete this.pressedKeys[e.key];
  };

  onPress = (key: string) => {
    if (this.currentState !== "game") {
      return;
    }
    switch (key) {
      // If the player presses left or right, move the current item (if possible)
      case this.inputMap.left: {
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
      case this.inputMap.right: {
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
      case this.inputMap.down: {
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
      case this.inputMap.hold: {
        if (this.canSwap) {
          this.swap();
        }
        break;
      }
      // If the player presses the trigger, rotate the qubit (if possible)
      case this.inputMap.flip: {
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

  async shake() {
    await animate([
      [this.view, { rotation: 0.1 }, { duration: 0.1 }],
      // [this.view, { rotation: -0.1 }, { duration: 0.1 }],
      [this.view, { rotation: 0 }, { type: "spring", duration: 1, bounce: 1 }],
    ]);
  }
}

function triangular(n: number) {
  return (n * (n - 1)) / 2;
}
