import { Container, HTMLText } from "pixi.js";
import { HEIGHT, WIDTH } from "./constants";

export default class Menu {
  view: Container;
  onStart?: () => void;

  constructor() {
    this.view = new Container();
    const titleText = new HTMLText({
      text: "<strong>Qaboom!</strong>",
      style: {
        align: "center",
        fill: "white",
        fontFamily: "Impact",
        fontSize: 48,
      },
    });
    this.view.position.x = WIDTH / 2;
    this.view.position.y = HEIGHT / 2;
    titleText.anchor = { x: 0.5, y: 0.5 };
    this.view.addChild(titleText);

    const startText = new HTMLText({
      text: "-- Start --",
      style: {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 24,
      },
    });
    startText.position.x = 0;
    startText.position.y = 50;
    startText.anchor.x = 0.5;
    this.view.addChild(startText);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case " ": {
        this.onStart?.();
      }
    }
  };

  show(parent: Container) {
    parent.addChild(this.view);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  hide() {
    this.view.parent.removeChild(this.view);
    document.removeEventListener("keydown", this.handleKeyDown);
  }
}
