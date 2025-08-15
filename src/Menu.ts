import { Container, Graphics, HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "./constants";
import GameNode from "./GameNode";
import { inputs } from "./inputs";
import { sounds } from "./audio";

export default class Menu extends GameNode {
  onStart?: (numPlayers: number) => void;
  numPlayers = 1;
  player1Text: HTMLText;
  player2Text: HTMLText;

  constructor() {
    super();
    this.view.position.x = WIDTH / 2;
    this.view.position.y = HEIGHT / 2;

    const boxHeight = 900;
    const boxWidth = 1500;
    this.view.addChild(
      new Graphics()
        .roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight)
        .fill({ color: theme.colors.background, alpha: 0.5 })
        .stroke({ color: theme.colors.primary, width: 5, alpha: 0.5 })
    );
    const titleText = new HTMLText({
      text: "<strong>Qaboom!</strong>",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: "Impact",
        fontSize: 256,
      },
    });
    titleText.anchor = { x: 0.5, y: 0.5 };
    titleText.position.y = -HEIGHT / 6;
    this.view.addChild(titleText);

    this.player1Text = new HTMLText({
      text: "<| 1 Player |>",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 72,
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
        fill: theme.colors.muted,
        fontWeight: "bold",
        fontFamily: TEXT_FONT,
        fontSize: 72,
      },
    });
    this.player2Text.position.x = 0;
    this.player2Text.position.y = 200;
    this.player2Text.anchor.x = 0.5;
    this.view.addChild(this.player2Text);
  }

  toggleNumPlayers() {
    if (this.numPlayers === 1) {
      this.player1Text.text = "1 Player";
      this.player1Text.style.fill = theme.colors.muted;
      this.player2Text.text = "<| 2 Players |>";
      this.player2Text.style.fill = theme.colors.primary;
      this.numPlayers = 2;
    } else {
      this.player1Text.text = "<| 1 Player |>";
      this.player1Text.style.fill = theme.colors.primary;
      this.player2Text.text = "2 Players";
      this.player2Text.style.fill = theme.colors.muted;
      this.numPlayers = 1;
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case inputs.player1.flip:
      case inputs.player2.flip: {
        sounds.clear.load();
        sounds.clear.play();
        this.onStart?.(this.numPlayers);
        break;
      }
      case inputs.player1.up:
      case inputs.player1.down:
      case inputs.player2.up:
      case inputs.player2.down: {
        sounds.turn.load();
        sounds.turn.play();
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
