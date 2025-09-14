import { Graphics, HTMLText } from "pixi.js";
import { container } from "../util";
import GameNode from "./GameNode";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import { getScores, type Score } from "../storage";
import { inputs } from "../inputs";

// The high score screen displayed in the main menu
// TODO: deduplicate from `ScoreScreen`
export default class HighScoreScreen extends GameNode {
  onFinish?: () => void;

  constructor() {
    super();
    document.addEventListener("keydown", this.handleKeyDown);
    const containerSize = HEIGHT * 0.75;
    this.view.position = { x: WIDTH / 2, y: HEIGHT / 2 };
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
    const scores = getScores();
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
    if (
      [
        ...Object.values(inputs.player1),
        ...Object.values(inputs.player2),
      ].includes(e.key)
    ) {
      document.removeEventListener("keydown", this.handleKeyDown);
      this.onFinish?.();
    }
  };
}
