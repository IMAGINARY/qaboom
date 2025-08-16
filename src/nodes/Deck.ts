import { Graphics, Ticker } from "pixi.js";
import MeasurementPiece from "./MeasurementPiece";
import { CELL_SIZE, PIECE_RADIUS } from "../constants";
import QubitPair from "./QubitPair";
import GatePiece from "./GatePiece";
import GameNode from "./GameNode";
import { container } from "../util";

export type Piece = QubitPair | MeasurementPiece | GatePiece;
const DECK_SIZE = 4;

const DECK_WIDTH = CELL_SIZE * 1.5;
const DECK_PIECE_HEIGHT = CELL_SIZE * 2.5;
const RECT_MARGIN = PIECE_RADIUS / 4;

type DealFn = () => Piece[];

// The deck of upcoming pieces to drop
export default class Deck extends GameNode {
  deck: Piece[] = [];
  buffer: Piece[] = [];
  #deal: DealFn;

  constructor(dealer: DealFn) {
    super();
    this.#deal = dealer;
    this.initDeck();
  }

  get deal() {
    return this.#deal;
  }

  set deal(value: DealFn) {
    this.#deal = value;
    // Replace the buffer whenever we reset the deck.
    this.buffer = this.#deal();
  }

  initDeck() {
    this.view.removeChildren();
    this.view.addChild(
      container(
        new Graphics().roundRect(
          -RECT_MARGIN,
          -RECT_MARGIN,
          DECK_WIDTH + 2 * RECT_MARGIN,
          DECK_PIECE_HEIGHT * DECK_SIZE + 2 * RECT_MARGIN,
          RECT_MARGIN * 2
        )
      )
    );
    this.deck = this.#deal()
      .filter((piece) => piece instanceof QubitPair)
      .slice(0, DECK_SIZE);
    for (let piece of this.deck) {
      this.view.addChild(piece.view);
    }
    this.buffer = this.#deal();
    this.setDeckPositions();
  }

  tick(time: Ticker) {
    for (let piece of this.deck) {
      piece.tick(time);
    }
  }

  setDeckPositions() {
    for (let [i, piece] of this.deck.entries()) {
      const offset = piece instanceof QubitPair ? 0.75 : 0.5;
      piece.view.position = {
        x: DECK_WIDTH / 2,
        y: (i + offset) * DECK_PIECE_HEIGHT,
      };
    }
  }

  pop() {
    const popped = this.deck.shift()!;
    this.view.removeChild(popped.view);
    const newItem = this.buffer.shift()!;
    if (this.buffer.length === 0) {
      this.buffer = this.#deal();
    }
    this.deck.push(newItem);
    this.view.addChild(newItem.view);
    this.setDeckPositions();
    return popped;
  }
}
