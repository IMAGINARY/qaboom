import { Container, HTMLText } from "pixi.js";
import { HEIGHT, WIDTH } from "./constants";
import GameNode from "./GameNode";

export default class Menu extends GameNode {
  onStart?: (numPlayers: number) => void;
  numPlayers = 1;
  player1Text: HTMLText;
  player2Text: HTMLText;

  constructor() {
    super();
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

    this.player1Text = new HTMLText({
      text: "< 1 Player >",
      style: {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 24,
      },
    });
    this.player1Text.position.x = 0;
    this.player1Text.position.y = 50;
    this.player1Text.anchor.x = 0.5;
    this.view.addChild(this.player1Text);
    this.player2Text = new HTMLText({
      text: "2 Players",
      style: {
        align: "center",
        fill: "white",
        fontFamily: "monospace",
        fontSize: 24,
      },
    });
    this.player2Text.position.x = 0;
    this.player2Text.position.y = 100;
    this.player2Text.anchor.x = 0.5;
    this.view.addChild(this.player2Text);
  }

  toggleNumPlayers() {
    if (this.numPlayers === 1) {
      this.player1Text.text = "1 Player";
      this.player2Text.text = "< 2 Players >";
      this.numPlayers = 2;
    } else {
      this.player1Text.text = "< 1 Player >";
      this.player2Text.text = "2 Players";
      this.numPlayers = 1;
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case " ": {
        this.onStart?.(this.numPlayers);
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        this.toggleNumPlayers();
        break;
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
