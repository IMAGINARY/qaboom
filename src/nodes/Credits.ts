import { Graphics, HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import { container } from "../util";
import GameNode from "./GameNode";

export default class Credits extends GameNode {
  onFinish?: () => void;

  constructor() {
    super();
    document.addEventListener("keydown", this.handleKeyDown);
    this.view.position.x = WIDTH / 2;
    this.view.position.y = HEIGHT / 2;

    const boxHeight = 900;
    const boxWidth = 1400;
    this.view.addChild(
      container(
        new Graphics().roundRect(
          -boxWidth / 2,
          -boxHeight / 2,
          boxWidth,
          boxHeight
        )
      )
    );
    const titleText = new HTMLText({
      text: "Credits",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontSize: 110,
      },
    });
    titleText.anchor = { x: 0.5, y: 0.5 };
    titleText.position.y = -HEIGHT / 6;
    this.view.addChild(titleText);
  }

  handleKeyDown = () => {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.onFinish?.();
  };
}
