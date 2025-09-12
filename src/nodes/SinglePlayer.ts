import { Point, type Ticker } from "pixi.js";
import { HEIGHT, WIDTH } from "../constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { campaign } from "../levels";
import Background from "./Background";
import { inputs } from "../inputs";
import ScoreScreen from "./ScoreScreen";
import Countdown from "./Countdown";
import { type IMediaInstance } from "@pixi/sound";
import { playSound } from "../audio";
import { slideIn } from "../animations";
import { UP } from "../points";

type Mode = "game" | "score";

export default class SinglePlayer extends GameNode {
  player: Player;
  onFinish?: () => void;
  background: Background;
  mode: Mode = "game";
  music?: IMediaInstance;

  constructor(background: Background, startLevel: number) {
    super();
    this.background = background;
    this.player = new Player({
      inputMap: inputs.player1,
      levels: campaign,
      startLevel,
    });
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
      const scores = new ScoreScreen(score, inputs.player1);
      scores.view.position = { x: WIDTH / 2, y: HEIGHT / 2 };
      this.view.addChild(scores.view);
      scores.onFinish = () => {
        scores.destroy();
        this.onFinish?.();
      };
      scores.start();
    };
  }

  async start() {
    this.view.addChild(this.player.view);
    slideIn(
      this.player.view,
      new Point(WIDTH / 2 - this.player.view.width / 2, 0),
      UP
    );

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
