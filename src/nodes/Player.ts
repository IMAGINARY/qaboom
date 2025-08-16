import { HTMLText, Point, Ticker, type PointData } from "pixi.js";
import "pixi.js/math-extras";
import MeasurementPiece from "./MeasurementPiece";
import { DOWN, LEFT, RIGHT, UP } from "../points";
import {
  CELL_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TEXT_FONT,
  theme,
  HEIGHT,
} from "../constants";
import Deck, { type Piece } from "./Deck";
import QubitPair from "./QubitPair";
import Board, { inBounds, startingCell } from "./Board";
import GatePiece from "./GatePiece";
import { type Level } from "../levels";
import GameNode from "./GameNode";
import { animate } from "motion";
import type { PlayerInput } from "../inputs";
import { pulse } from "../animations";
import { delay } from "../util";
import { playSound } from "../audio";

type State = "pause" | "game";

const MAX_MULTIPLIER = 1 / 5;

// Initial rate at which pieces fall
const INITIAL_STEP_RATE = 750;
// The rate at which to check if inputs are still pressed
const INPUT_POLL_RATE = 120;

const rateMultiplier = 0.9;
const levelCount = 16;

const BOARD_OFFSET_Y = 80;

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
  onLevelUp?: (level: Level) => void;
  pressedKeys: Record<string, number> = {};

  levels: Level[];
  board: Board;
  deck: Deck;
  scoreboard: HTMLText;
  levelSign: HTMLText;

  hold: Piece | null = null;
  canSwap = true;

  currentState: State = "pause";
  #score: number = 0;

  // Level related
  #level = 0;
  rateMultiplier = 1;
  pieceCount = 0;

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
    this.board.view.position = { x: 50, y: BOARD_OFFSET_Y };
    this.view.addChild(this.board.view);

    this.deck = new Deck(levels[this.level].deal);
    this.deck.view.position = {
      x: 50 + BOARD_WIDTH * CELL_SIZE + 35,
      y: BOARD_OFFSET_Y,
    };
    this.deck.view.scale = 0.75;
    this.view.addChild(this.deck.view);

    this.scoreboard = new HTMLText({
      text: "" + this.score,
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 48,
      },
    });
    this.scoreboard.position = {
      x: this.view.width,
      y: 10,
    };
    this.scoreboard.anchor = { x: 1, y: 0 };
    this.view.addChild(this.scoreboard);

    this.levelSign = new HTMLText({
      text: "Lvl " + (this.level + 1),
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 48,
      },
    });
    this.levelSign.position = { x: 50, y: 10 };
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
    pulse(this.scoreboard);
  }

  start() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    this.currentState = "game";
    this.onLevelUp?.(this.levels[this.level]);
  }

  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
  }

  tick = (time: Ticker) => {
    this.board.tick(time);
    this.deck.tick(time);
    if (this.currentState === "pause") {
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
    if (this.time >= this.nextTime) {
      this.step();
      this.nextTime = this.time + INITIAL_STEP_RATE * this.rateMultiplier;
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

  async resolve() {
    this.currentState = "pause";
    if (
      await this.board.resolve((score) => {
        this.score += score;
      })
    ) {
      this.newCurrent();
      this.currentState = "game";
    } else {
      this.gameOver();
    }
  }

  // Resolve the current piece's action when it can't move any more.
  gameOver() {
    this.currentState = "pause";
    playSound("gameOver");
    this.fallOff().then(() => {
      this.onGameOver?.(this.score);
    });
  }

  newCurrent() {
    this.pieceCount++;
    // Increase level
    if (this.pieceCount > levelCount) {
      this.level++;
      playSound("levelUp");
      this.pieceCount = 0;
      if (this.level > this.levels.length - 1) {
        this.rateMultiplier *= rateMultiplier;
        this.rateMultiplier = Math.max(this.rateMultiplier, MAX_MULTIPLIER);
      } else {
        this.deck.deal = this.levels[this.level].deal;
        this.onLevelUp?.(this.levels[this.level]);
      }
    }
    this.canSwap = true;
    this.board.current = this.deck.pop();
    this.board.setCurrentPosition(startingCell);
    this.board.view.addChild(this.board.current.view);
  }

  swap() {
    this.canSwap = false;
    playSound("swap");
    [this.board.current, this.hold] = [this.hold, this.board.current];
    if (!this.board.current) {
      this.newCurrent();
    }
    this.board.setCurrentPosition(startingCell);
    if (this.hold) {
      this.hold.view.position = {
        x: this.board.view.width + 100,
        y: this.deck.view.height + 150,
      };
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
        playSound("move");
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
        playSound("move");
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
          playSound("turn");
          break;
        } else if (this.board.current instanceof GatePiece) {
          this.board.current.rotate();
          playSound("turn");
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
          playSound("turn");
        }
        break;
      }
    }
  };

  async fallOff() {
    await animate([
      [this.view, { rotation: 0.1 }, { duration: 0.1 }],
      // [this.view, { rotation: -0.1 }, { duration: 0.1 }],
      [
        this.view,
        { rotation: 0 },
        { type: "spring", duration: 0.75, bounce: 1 },
      ],
    ]);
    await delay(250);
    const duration = 1;
    await animate([
      [this.view, { rotation: Math.PI / 2 }, { duration }],
      [this.view, { opacity: 0 }, { duration, at: 0 }],
      [this.view.position, { y: 1.5 * HEIGHT }, { duration, at: 0 }],
    ]);
  }
}
