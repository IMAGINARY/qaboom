import { Graphics, Container } from "pixi.js";
import QubitPiece from "./QubitPiece";
import MeasurementPiece from "./MeasurementPiece";
import { CELL_SIZE } from "./constants";

type Piece = QubitPiece | MeasurementPiece;
const DECK_SIZE = 5;

const DECK_WIDTH = CELL_SIZE * 2;
const DECK_PIECE_HEIGHT = CELL_SIZE * 1.5;

// The deck of upcoming pieces to drop
export default class Deck {
  view: Container;
  deck: Piece[] = [];

  constructor() {
    this.view = new Container();
    this.view.position = { x: 325, y: 0 };
    this.view.addChild(
      new Graphics()
        .rect(0, 0, DECK_WIDTH, DECK_PIECE_HEIGHT * DECK_SIZE)
        .stroke("white")
    );
    this.initDeck();
    this.setDeckPositions();
  }

  initDeck() {
    for (let i = 0; i < DECK_SIZE; i++) {
      this.deck.push(getNewItem());
    }
    for (let piece of this.deck) {
      this.view.addChild(piece.sprite);
    }
  }

  setDeckPositions() {
    for (let [i, piece] of this.deck.entries()) {
      piece.sprite.position = {
        x: DECK_WIDTH / 2,
        y: (i + 0.5) * DECK_PIECE_HEIGHT,
      };
    }
  }

  pop() {
    const popped = this.deck.shift()!;
    this.view.removeChild(popped.sprite);
    const newItem = getNewItem();
    this.deck.push(newItem);
    this.view.addChild(newItem.sprite);
    this.setDeckPositions();
    return popped;
  }
}

function getNewItem() {
  if (Math.random() < 1 / 4) {
    return MeasurementPiece.random();
  } else {
    return QubitPiece.random();
  }
}
