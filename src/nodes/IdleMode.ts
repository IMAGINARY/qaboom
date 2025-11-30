import { Point, type Ticker } from "pixi.js";
import { WIDTH } from "../constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { campaign } from "../levels";
import Background from "./Background";
import { inputManager, inputs } from "../inputs";
import Countdown from "./Countdown";
import { type IMediaInstance } from "@pixi/sound";
import { playSound } from "../audio";
import { slideIn } from "../animations";
import { UP } from "../points";
import { choice } from "../random";

type Mode = "game" | "score";

export default class IdleMode extends GameNode {
  player: Player;
  onFinish?: () => void;
  background: Background;
  mode: Mode = "game";
  music?: IMediaInstance;

  constructor(background: Background, startLevel: number) {
    super();
    this.background = background;
    this.player = new Player({
      playerIndex: "player1",
      levels: campaign,
      startLevel,
    });
    this.player.onLevelUp = (level) => {
      this.background.setGenerator(level.randomQubit);
    };
    this.player.onTopOut = () => {
      this.music?.stop();
    };
    this.player.onGameOver = () => {
      this.view.removeChild(this.player.view);
      this.player.destroy();
      this.endIdle();
    };
  }

  async start() {
    this.view.addChild(this.player.view);
    inputManager.addKeydownListener(this.handleKeyDown);
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
      // Very simple, just press a random button
      if (Math.random() < 0.02)
        this.player.onPress(choice(Object.values(inputs.player1)));
    }
  };

  endIdle() {
    this.music?.stop();
    inputManager.removeKeydownListener(this.handleKeyDown);
    this.player.destroy();
    this.onFinish?.();
  }

  handleKeyDown = () => {
    this.endIdle();
  };
}
