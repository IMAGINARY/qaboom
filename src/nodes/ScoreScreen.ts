import { Container, Graphics, HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import GameNode from "./GameNode";
import { inputs } from "../inputs";
import { getScores, setScores, type Score } from "../storage";
import { playSound } from "../audio";
import { container } from "../util";
import { pulse } from "../animations";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

type State = "enter_name" | "high_scores";

// List of player scores
export default class ScoreScreen extends GameNode {
  score: number;
  letters: HTMLText[];
  #activeIndex = 0;
  nameEnter = new Container();
  arrows = new Container();
  state: State = "enter_name";
  onFinish?: () => void;

  constructor(score: number) {
    super();
    this.score = score;
    this.view.position = { x: WIDTH / 2, y: HEIGHT / 2 };

    const containerSize = HEIGHT * 0.75;
    this.view.addChild(
      container(
        new Graphics().roundRect(
          -containerSize / 2,
          -containerSize / 2,
          containerSize,
          containerSize
        )
      )
    );

    this.letters = [];
    for (let i = 0; i < 3; i++) {
      this.letters.push(
        new HTMLText({
          text: "A",
          style: {
            fill: "grey",
            fontFamily: TEXT_FONT,
            fontWeight: "bold",
            fontSize: 256,
          },
        })
      );
    }
    const title = new HTMLText({
      text: "Enter your name",
      style: {
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 48,
      },
    });
    title.anchor = { x: 0.5, y: 0.5 };
    title.position.y = -300;
    this.nameEnter.addChild(title);

    this.letters[0].position = { x: -200, y: 0 };
    this.letters[1].position = { x: 0, y: 0 };
    this.letters[2].position = { x: 200, y: 0 };
    for (let letter of this.letters) {
      letter.anchor = { x: 0.5, y: 0.5 };
      this.nameEnter.addChild(letter);
    }

    const arrowRadius = 30;
    const arrowBase = 125;
    this.arrows.addChild(
      new Graphics()
        .poly([
          -arrowRadius,
          arrowBase,
          0,
          arrowBase + arrowRadius,
          arrowRadius,
          arrowBase,
        ])
        .fill(theme.colors.primary),
      new Graphics()
        .poly([
          -arrowRadius,
          -arrowBase,
          0,
          -(arrowBase + arrowRadius),
          arrowRadius,
          -arrowBase,
        ])
        .fill(theme.colors.primary)
    );
    this.nameEnter.addChild(this.arrows);

    this.letters[this.#activeIndex].style.fill = theme.colors.primary;
    this.arrows.position.x = this.letters[this.#activeIndex].position.x;
    this.view.addChild(this.nameEnter);
  }

  showHighScores() {
    this.state = "high_scores";
    this.view.removeChild(this.nameEnter);
    const scores = getScores();
    let index = scores.findIndex((entry) => entry.score < this.score);
    if (index === -1) {
      index = scores.length;
    }
    const name = this.letters.map((letter) => letter.text).join("");
    const newEntry = {
      name,
      score: this.score,
    };
    scores.splice(index, 0, newEntry);
    setScores(scores);
    const highScoresLabel = new HTMLText({
      text: "High Scores",
      style: {
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontSize: 72,
        fontWeight: "bold",
      },
    });
    highScoresLabel.position.y = -300;
    highScoresLabel.anchor = { x: 0.5, y: 0.5 };
    this.view.addChild(highScoresLabel);
    for (let [i, entry] of scores.slice(0, 8).entries()) {
      this.showEntry(i, entry, -200 + i * 60);
    }
    this.showEntry(index, newEntry, -200 + 9 * 60);
  }

  showEntry(index: number, entry: Score, position: number) {
    const nameText = new HTMLText({
      text: `${(index + 1 + "").padStart(3)} ${entry.name}`,
      style: {
        fontFamily: TEXT_FONT,
        fill: theme.colors.primary,
        fontSize: 48,
        fontWeight: "bold",
      },
    });
    nameText.position = { x: -300, y: position };
    nameText.anchor = { x: 0, y: 0.5 };
    const scoreText = new HTMLText({
      text: entry.score,
      style: {
        fontFamily: TEXT_FONT,
        fill: theme.colors.primary,
        fontSize: 48,
        fontWeight: "bold",
      },
    });
    scoreText.position = { x: 250, y: position };
    scoreText.anchor = { x: 1, y: 0.5 };
    this.view.addChild(scoreText);
    this.view.addChild(nameText);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (this.state === "enter_name") {
      switch (e.key) {
        // up/down: change letter
        case inputs.player1.up: {
          const currentLetter = this.letters[this.#activeIndex];
          const letterIndex = LETTERS.indexOf(currentLetter.text);
          currentLetter.text = LETTERS[(letterIndex || LETTERS.length) - 1];
          pulse(currentLetter, 1.1);
          playSound("move");
          break;
        }
        case inputs.player1.down: {
          const currentLetter = this.letters[this.#activeIndex];
          const letterIndex = LETTERS.indexOf(currentLetter.text);
          currentLetter.text = LETTERS[(letterIndex + 1) % LETTERS.length];
          pulse(currentLetter, 1.1);
          playSound("move");
          break;
        }
        // left/right: change active index
        case inputs.player1.left: {
          this.activeIndex = (this.activeIndex || this.letters.length) - 1;
          playSound("move");
          break;
        }
        case inputs.player1.right: {
          this.activeIndex = (this.activeIndex + 1) % this.letters.length;
          playSound("move");
          break;
        }
        case inputs.player1.flip: {
          playSound("clear");
          this.showHighScores();
          break;
        }
      }
    } else {
      // Press any key to go back to start
      this.onFinish?.();
    }
  };

  get activeIndex() {
    return this.#activeIndex;
  }

  set activeIndex(value: number) {
    this.letters[this.#activeIndex].style.fill = theme.colors.muted;
    this.#activeIndex = value;
    const active = this.letters[this.#activeIndex];
    active.style.fill = theme.colors.primary;
    this.arrows.position.x = active.position.x;
    pulse(active, 1.1);
  }

  start() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }
}
