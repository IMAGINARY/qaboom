import { Container, Graphics, HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import GameNode from "./GameNode";
import { inputs } from "../inputs";
import { container } from "../util";
import { pulse } from "../animations";
import { playSound } from "../audio";
import { campaign } from "../levels";
import type Background from "./Background";

type State = "player-select" | "level-select";

export default class Menu extends GameNode {
  state: State = "player-select";
  onStart?: (numPlayers: number, level: number) => void;
  numPlayers = 1;
  level = 0;
  player1Text: HTMLText;
  player2Text: HTMLText;
  levelText: HTMLText;
  playerSelect = new Container();
  levelSelect = new Container();
  background: Background;

  constructor(background: Background) {
    super();
    this.background = background;
    this.view.position.x = WIDTH / 2;
    this.view.position.y = HEIGHT / 2;

    const boxHeight = 900;
    const boxWidth = 1500;
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
      text: "<strong>Qaboom!</strong>",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: "sans-serif",
        // fontWeight: "bold",
        fontSize: 220,
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
    this.player1Text.anchor = { x: 0.5, y: 0.5 };
    this.playerSelect.addChild(this.player1Text);
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
    this.player2Text.anchor = { x: 0.5, y: 0.5 };
    this.playerSelect.addChild(this.player2Text);
    this.view.addChild(this.playerSelect);
    this.levelText = new HTMLText({
      text: "Level 1",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontWeight: "bold",
        fontFamily: TEXT_FONT,
        fontSize: 72,
      },
    });
    this.levelText.anchor = { x: 0.5, y: 0.5 };
    this.levelSelect.position.x = 0;
    this.levelSelect.position.y = 100;
    this.levelSelect.addChild(this.levelText);
    const leftArrow = new Graphics()
      .poly([-300, 0, -250, 30, -250, -30])
      .fill(theme.colors.primary);
    const rightArrow = new Graphics()
      .poly([300, 0, 250, 30, 250, -30])
      .fill(theme.colors.primary);
    this.levelSelect.addChild(leftArrow);
    this.levelSelect.addChild(rightArrow);
  }

  toggleNumPlayers() {
    if (this.numPlayers === 1) {
      this.player1Text.text = "1 Player";
      this.player1Text.style.fill = theme.colors.muted;
      this.player2Text.text = "<| 2 Players |>";
      this.player2Text.style.fill = theme.colors.primary;
      pulse(this.player2Text, 1.1);
      this.numPlayers = 2;
    } else {
      this.player1Text.text = "<| 1 Player |>";
      this.player1Text.style.fill = theme.colors.primary;
      pulse(this.player1Text, 1.1);
      this.player2Text.text = "2 Players";
      this.player2Text.style.fill = theme.colors.muted;
      this.numPlayers = 1;
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    switch (this.state) {
      case "player-select": {
        switch (e.key) {
          case inputs.player1.flip:
          case inputs.player2.flip: {
            playSound("clear");
            this.showLevelSelect();
            break;
          }
          case inputs.player1.up:
          case inputs.player1.down:
          case inputs.player2.up:
          case inputs.player2.down: {
            playSound("turn");
            this.toggleNumPlayers();
            break;
          }
        }
        break;
      }
      case "level-select": {
        switch (e.key) {
          case inputs.player1.flip:
          case inputs.player2.flip: {
            playSound("clear");
            this.onStart?.(this.numPlayers, this.level);
            break;
          }
          case inputs.player1.left:
          case inputs.player2.left: {
            this.toggleLevel((this.level || campaign.length) - 1);
            break;
          }

          case inputs.player1.right:
          case inputs.player2.right: {
            this.toggleLevel((this.level + 1) % campaign.length);
            break;
          }
        }
        break;
      }
    }
  };

  showLevelSelect() {
    this.state = "level-select";
    this.view.removeChild(this.playerSelect);
    this.view.addChild(this.levelSelect);
    this.toggleLevel(this.level);
  }

  toggleLevel(level: number) {
    this.level = level;
    this.levelText.text = `Level ${this.level + 1}`;
    playSound("turn");
    pulse(this.levelSelect);
    this.background.setGenerator(campaign[this.level].randomQubit);
  }

  show(parent: Container) {
    parent.addChild(this.view);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  hide() {
    this.view.parent.removeChild(this.view);
    document.removeEventListener("keydown", this.handleKeyDown);
  }
}
