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

const options = ["1 Player", "2 Player", "High Scores", "Credits"];

export default class Menu extends GameNode {
  state: State = "player-select";
  onStart?: (numPlayers: number, level: number) => void;
  onHighScores?: () => void;
  onCredits?: () => void;
  optionIndex: number = 0;
  optionTexts: HTMLText[];
  level = 0;
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
      text: "<strong>Qaboom!</strong>",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        // fontWeight: "bold",
        fontSize: 220,
      },
    });
    titleText.anchor = { x: 0.5, y: 0.5 };
    titleText.position.y = -HEIGHT / 6;
    this.view.addChild(titleText);

    this.optionTexts = [];
    for (let [i, option] of options.entries()) {
      const text = new HTMLText({
        text: option,
        style: {
          align: "center",
          fill: theme.colors.muted,
          fontFamily: TEXT_FONT,
          fontWeight: "bold",
          fontSize: 72,
        },
      });
      text.anchor = { x: 0.5, y: 0.5 };
      text.position.y = i * 100;
      this.optionTexts.push(text);
      this.playerSelect.addChild(text);
    }
    this.setOptionIndex(this.optionIndex);

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

  setOptionIndex(index: number) {
    this.optionTexts[this.optionIndex].text = options[this.optionIndex];
    this.optionTexts[this.optionIndex].style.fill = theme.colors.muted;
    this.optionTexts[index].text = `<| ${options[index]} |>`;
    this.optionTexts[index].style.fill = theme.colors.primary;
    this.optionIndex = index;
    pulse(this.optionTexts[index]);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    switch (this.state) {
      case "player-select": {
        switch (e.key) {
          case inputs.player1.flip:
          case inputs.player2.flip: {
            playSound("clear");
            if (this.optionIndex === 2) {
              this.onHighScores?.();
            }
            if (this.optionIndex === 3) {
              this.onCredits?.();
            } else {
              this.showLevelSelect();
            }
            break;
          }
          case inputs.player1.up:
          case inputs.player2.up: {
            playSound("turn");
            this.setOptionIndex((this.optionIndex || options.length) - 1);
            break;
          }
          case inputs.player1.down:
          case inputs.player2.down: {
            playSound("turn");
            this.setOptionIndex((this.optionIndex + 1) % options.length);
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
            this.onStart?.(this.optionIndex + 1, this.level);
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

  showPlayerSelect() {
    this.state = "player-select";
    this.view.removeChild(this.levelSelect);
    this.view.addChild(this.playerSelect);
  }

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
    this.showPlayerSelect();
    document.addEventListener("keydown", this.handleKeyDown);
  }

  hide() {
    this.view.parent.removeChild(this.view);
    document.removeEventListener("keydown", this.handleKeyDown);
  }
}
