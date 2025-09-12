import { Container, Graphics, HTMLText } from "pixi.js";
import { container } from "../util";
import GameNode from "./GameNode";
import type { Piece } from "./Deck";
import QubitPair from "./QubitPair";
import { CELL_SIZE, TEXT_FONT, theme } from "../constants";

const header = 75;
const width = 200;
const height = 200;
export default class HoldArea extends GameNode {
  held: Piece | null = null;
  container: Container = new Container();
  constructor() {
    super();
    this.view.scale = 0.75;
    this.view.addChild(
      container(new Graphics().roundRect(0, 0, width, header + height))
    );

    this.view.addChild(this.container);
    const text = new HTMLText({
      text: "HOLD",
      style: {
        fill: theme.colors.primary,
        stroke: { color: theme.colors.background, width: 10 },
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 48,
      },
    });
    text.anchor = { x: 0.5, y: 0.5 };
    text.position = { x: width / 2, y: header / 2 };
    this.view.addChild(text);
    this.container.position = { x: width / 2, y: header + height / 2 };
  }

  setHold(piece: Piece) {
    const previous = this.held;
    this.held = piece;
    this.container.addChild(this.held.view);
    this.held.view.position = { x: 0, y: 0 };
    if (piece instanceof QubitPair) {
      if (piece.orientation === "vertical") {
        this.held.view.position.y += CELL_SIZE / 2;
      } else {
        this.held.view.position.x -= CELL_SIZE / 2;
      }
    }
    return previous;
  }
}
