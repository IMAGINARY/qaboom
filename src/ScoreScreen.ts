import { Container, Graphics, HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "./constants";
import GameNode from "./GameNode";
import { inputs } from "./inputs";
import { getScores, setScores } from "./storage";
import { sounds } from "./audio";
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

    this.view.addChild(
      new Graphics()
        .roundRect(-300, -300, 600, 600)
        .fill({ color: theme.colors.background, alpha: 0.5 })
        .stroke({ color: theme.colors.primary, width: 2 })
    );

    this.letters = [];
    for (let i = 0; i < 3; i++) {
      this.letters.push(
        new HTMLText({
          text: "A",
          style: {
            fill: "grey",
            fontFamily: TEXT_FONT,
            fontWeight: "600",
            fontSize: 72,
          },
        })
      );
    }
    const title = new HTMLText({
      text: "Enter your name",
      style: {
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontSize: 48,
      },
    });
    title.anchor = { x: 0.5, y: 0.5 };
    title.position.y = -100;
    this.nameEnter.addChild(title);

    this.letters[0].position = { x: -50, y: 0 };
    this.letters[1].position = { x: 0, y: 0 };
    this.letters[2].position = { x: 50, y: 0 };
    for (let letter of this.letters) {
      letter.anchor = { x: 0.5, y: 0.5 };
      this.nameEnter.addChild(letter);
    }
    this.arrows.addChild(
      new Graphics().poly([-10, 50, 0, 60, 10, 50]).fill(theme.colors.primary),
      new Graphics()
        .poly([-10, -50, 0, -60, 10, -50])
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
    scores.splice(index, 0, {
      name,
      score: this.score,
    });
    setScores(scores);
    const highScoresLabel = new HTMLText({
      text: "High Scores",
      style: {
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontSize: 72,
      },
    });
    highScoresLabel.position.y = -250;
    highScoresLabel.anchor = { x: 0.5, y: 0.5 };
    this.view.addChild(highScoresLabel);
    for (let [i, entry] of scores.slice(0, 8).entries()) {
      const nameText = new HTMLText({
        text: entry.name,
        style: {
          fontFamily: TEXT_FONT,
          fill: theme.colors.primary,
        },
      });
      nameText.position = { x: -100, y: -150 + i * 50 };
      nameText.anchor = { x: 0, y: 0.5 };
      const scoreText = new HTMLText({
        text: entry.score,
        style: {
          fontFamily: TEXT_FONT,
          fill: theme.colors.primary,
        },
      });
      scoreText.position = { x: 100, y: -150 + i * 50 };
      scoreText.anchor = { x: 1, y: 0.5 };
      this.view.addChild(scoreText);
      this.view.addChild(nameText);
    }
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (this.state === "enter_name") {
      switch (e.key) {
        // up/down: change letter
        case inputs.player1.up: {
          const currentLetter = this.letters[this.#activeIndex];
          const letterIndex = LETTERS.indexOf(currentLetter.text);
          currentLetter.text = LETTERS[(letterIndex || LETTERS.length) - 1];
          sounds.move.load();
          sounds.move.play();
          break;
        }
        case inputs.player1.down: {
          const currentLetter = this.letters[this.#activeIndex];
          const letterIndex = LETTERS.indexOf(currentLetter.text);
          currentLetter.text = LETTERS[(letterIndex + 1) % LETTERS.length];
          sounds.move.load();
          sounds.move.play();
          break;
        }
        // left/right: change active index
        case inputs.player1.left: {
          this.activeIndex = (this.activeIndex || this.letters.length) - 1;
          sounds.move.load();
          sounds.move.play();
          break;
        }
        case inputs.player1.right: {
          this.activeIndex = (this.activeIndex + 1) % this.letters.length;
          sounds.move.load();
          sounds.move.play();
          break;
        }
        case inputs.player1.flip: {
          sounds.clear.load();
          sounds.clear.play();
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
    this.letters[this.#activeIndex].style.fill = theme.colors.primary;
    this.arrows.position.x = this.letters[this.#activeIndex].position.x;
  }

  start() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }
}
