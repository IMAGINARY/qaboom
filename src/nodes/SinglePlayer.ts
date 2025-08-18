import { type Ticker } from "pixi.js";
import { WIDTH } from "../constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { campaign } from "../levels";
import Background from "./Background";
import { inputs } from "../inputs";
import ScoreScreen from "./ScoreScreen";
import Countdown from "./Countdown";
import { type IMediaInstance } from "@pixi/sound";
import { playSound } from "../audio";

type Mode = "game" | "score";

export default class SinglePlayer extends GameNode {
  player: Player;
  onFinish?: () => void;
  background: Background;
  mode: Mode = "game";
  music?: IMediaInstance;

  constructor(background: Background) {
    super();
    this.background = background;
    this.player = new Player({
      position: { x: WIDTH / 2 - 300, y: 0 },
      inputMap: inputs.player1,
      levels: campaign,
    });
    this.view.addChild(this.player.view);

    this.player.onLevelUp = (level) => {
      this.background.setGenerator(level.randomQubit);
    };
    this.player.onTopOut = () => {
      this.music?.stop();
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
    };
  }

  async start() {
    const countdown = new Countdown();
    this.view.addChild(countdown.view);
    await countdown.start();
    this.player.start();
    this.view.removeChild(countdown.view);
    this.music = await playSound("bgMusic", { loop: true });
  }

  tick = (time: Ticker) => {
    if (this.mode === "game") {
      this.player.tick(time);
    }
  };
}
