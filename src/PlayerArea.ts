import { Container, HTMLText, Point, Ticker, type PointData } from "pixi.js";
import "pixi.js/math-extras";
import { uniqWith } from "lodash-es";
import MeasurementPiece from "./MeasurementPiece";
import { DOWN, LEFT, neighbors, orthoNeighbors, RIGHT, UP } from "./points";
import { CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT } from "./constants";
import Deck, { type Piece } from "./Deck";
import QubitPair from "./QubitPair";
import Board, { inBounds, startingCell } from "./Board";
import GatePiece from "./GatePiece";
import { sounds } from "./audio";
import EntanglerPiece from "./EntanglerPiece";
import { choice } from "./random";
import EntangledPair from "./EntangledPair";

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
export default class PlayerArea {
  onGameOver?: () => void;

  view: Container;
  board: Board;
  deck: Deck;
  scoreboard: HTMLText;

  hold: Piece | null = null;
  canSwap = true;

  currentState: State = "game";
  #score: number = 0;

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
    this.view = new Container();
    // TODO be able to reference the "current" position based on the board.
    this.view.position = position;
    this.inputMap = inputMap;

    this.board = new Board();
    this.board.view.position = { x: 50, y: 50 };

    this.deck = new Deck();
    this.deck.view.position = { x: 50 + BOARD_WIDTH * CELL_SIZE + 20, y: 50 };
    this.deck.view.scale = 0.75;

    this.scoreboard = new HTMLText({
      text: "" + this.score,
      style: {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 32,
      },
    });
    this.scoreboard.position = { x: 50, y: 0 };

    this.initialize();
  }

  initialize() {
    this.score = 0;
    this.view.removeChildren();

    this.view.addChild(this.scoreboard);
    this.view.addChild(this.board.view);
    this.view.addChild(this.deck.view);

    this.board.initialize();
    this.newCurrent();
  }

  get score() {
    return this.#score;
  }

  set score(value: number) {
    this.#score = value;
    this.scoreboard.text = `${this.#score * 100}`;
  }

  show(parent: Container) {
    parent.addChild(this.view);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  hide() {
    this.view.parent.removeChild(this.view);
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
    } else if (this.board.current instanceof EntanglerPiece) {
      // Create the entangled pair and place them in the right areas.
      const pair = new EntangledPair();
      this.board.setPiece(this.board.currentPosition, pair.first);
      this.board.setPiece(this.board.current.target, pair.second);
      this.board.view.removeChild(this.board.current?.sprite!);
      this.newCurrent();
    }
  }

  measureStep() {
    if (this.measureQueue.length === 0) {
      this.resolveMeasurement();
      return;
    }
    let newQueue: Point[] = [];
    const current = this.board.current as MeasurementPiece;
    this.visited = this.visited.concat(this.measureQueue);
    const scoreSound =
      sounds.score[Math.min(this.measureCount, sounds.score.length - 1)];
    scoreSound.load();
    scoreSound.play();
    for (const point of this.measureQueue) {
      const qubit = this.board.getPiece(point);
      if (!qubit) continue;
      if (qubit.measure(current)) {
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
    this.board.view.removeChild(this.board.current!.sprite);
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
    sounds.gate.load();
    sounds.gate.play();
    // Apply the gate on everything in the gate's column
    // const x = this.currentPosition.x;
    // for (let y = this.currentPosition.y + 1; y < BOARD_HEIGHT; y++) {
    //   const p = new Point(x, y);
    //   const piece = this.board.getPiece(p);
    //   piece?.setValue(
    //     math.multiply((this.current as GatePiece).matrix, piece.value) as Qubit
    //   );
    // }
    // Apply the gate on the surrounding pieces
    for (let p of neighbors(this.board.currentPosition)) {
      let piece = this.board.getPiece(p);
      if (piece) {
        piece.applyGate(this.board.current as GatePiece);
      }
    }
    this.currentState = "game";
    this.board.view.removeChild(this.board.current?.sprite!);
    this.newCurrent();
  }

  newCurrent() {
    this.pieceCount++;
    if (this.pieceCount > levelCount) {
      this.pieceCount = 0;
      this.rateMultiplier *= rateMultiplier;
      this.rateMultiplier = Math.max(this.rateMultiplier, MAX_MULTIPLIER);
    }
    this.canSwap = true;
    this.board.current = this.deck.pop();
    if (this.board.current instanceof EntanglerPiece) {
      this.board.current.target = choice(this.board.validCells);
    }

    this.board.setCurrentPosition(startingCell);
    this.board.view.addChild(this.board.current.sprite);
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
      this.hold.sprite.position = { x: 400, y: 600 };
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
