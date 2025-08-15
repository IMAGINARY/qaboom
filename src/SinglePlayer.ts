import { type Ticker } from "pixi.js";
import { WIDTH } from "./constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { campaign } from "./levels";
import Background from "./Background";
import { inputs } from "./inputs";
import ScoreScreen from "./ScoreScreen";

type Mode = "game" | "score";

export default class SinglePlayer extends GameNode {
  player: Player;
  onFinish?: () => void;
  background: Background;
  mode: Mode = "game";

  constructor(background: Background) {
    super();
    this.background = background;
    // this.view.addChild(this.background.view);
    this.player = new Player({
      position: { x: WIDTH / 2 - 250, y: 0 },
      inputMap: inputs.player1,
      levels: campaign,
    });
    this.view.addChild(this.player.view);

    this.player.onLevelUp = (level) => {
      for (let piece of this.background.pieces) {
        piece.setValue(level.randomQubit());
      }
    };
    this.player.onGameOver = (score) => {
      this.view.removeChild(this.player.view);
      this.player.destroy();
      this.mode = "score";
      const scores = new ScoreScreen(score * 100);
      this.view.addChild(scores.view);
      scores.onFinish = () => {
        scores.destroy();
        this.onFinish?.();
      };
      scores.start();
      // this.onFinish?.();
    };
  }

  show() {
    this.player.start();
  }

  tick = (time: Ticker) => {
    if (this.mode === "game") {
      this.player.tick(time);
    }
  };
}
