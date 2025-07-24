import { Container, HTMLText } from "pixi.js";

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
    titleText.position.x = 500 / 2;
    titleText.position.y = 250;
    titleText.anchor.x = 0.5;
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
    startText.position.x = 500 / 2;
    startText.position.y = 350;
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
