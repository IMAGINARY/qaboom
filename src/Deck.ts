import { Graphics, Container, Ticker } from "pixi.js";
import MeasurementPiece from "./MeasurementPiece";
import { CELL_SIZE } from "./constants";
import QubitPair from "./QubitPair";
import { range, shuffle } from "lodash-es";
import GatePiece from "./GatePiece";

export type Piece = QubitPair | MeasurementPiece | GatePiece;
const DECK_SIZE = 4;

const DECK_WIDTH = CELL_SIZE * 2;
const DECK_PIECE_HEIGHT = CELL_SIZE * 2.5;

// The deck of upcoming pieces to drop
export default class Deck {
  view: Container;
  deck: Piece[] = [];
  buffer: Piece[] = [];

  constructor() {
    this.view = new Container();
    this.initDeck();
  }

  initDeck() {
    this.view.removeChildren();
    this.view.addChild(
      new Graphics()
        .rect(0, 0, DECK_WIDTH, DECK_PIECE_HEIGHT * DECK_SIZE)
        .stroke({ color: "white", width: 2 })
    );
    for (let i = 0; i < DECK_SIZE; i++) {
      // The first items in the deck should be qubit pairs.
      this.deck.push(QubitPair.random());
    }
    for (let piece of this.deck) {
      this.view.addChild(piece.sprite);
    }
    this.buffer = newBuffer();
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
      piece.sprite.position = {
        x: DECK_WIDTH / 2,
        y: (i + offset) * DECK_PIECE_HEIGHT,
      };
    }
  }

  pop() {
    const popped = this.deck.shift()!;
    this.view.removeChild(popped.sprite);
    const newItem = this.buffer.shift()!;
    if (this.buffer.length === 0) {
      this.buffer = newBuffer();
    }
    this.deck.push(newItem);
    this.view.addChild(newItem.sprite);
    this.setDeckPositions();
    return popped;
  }
}

function newBuffer() {
  let buffer = [];
  for (let _i of range(4)) {
    buffer.push(QubitPair.random());
  }
  buffer.push(GatePiece.random());
  for (let _i of range(1)) {
    buffer.push(MeasurementPiece.random());
  }
  return shuffle(buffer);
}
