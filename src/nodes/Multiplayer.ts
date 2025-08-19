import { Point, type Ticker } from "pixi.js";
import { WIDTH } from "../constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { campaign } from "../levels";
import Background from "./Background";
import { inputs } from "../inputs";
import Countdown from "./Countdown";
import type { IMediaInstance } from "@pixi/sound";
import { playSound } from "../audio";
import { LEFT, RIGHT } from "../points";
import { slideIn } from "../animations";

export default class Multiplayer extends GameNode {
  players: Player[];
  background: Background;
  onFinish?: () => void;
  music?: IMediaInstance;

  constructor(background: Background, startLevel: number) {
    super();
    this.background = background;
    this.players = [
      new Player({
        inputMap: inputs.player1,
        levels: campaign,
        startLevel,
      }),

      new Player({
        inputMap: inputs.player2,
        levels: campaign,
        startLevel,
      }),
    ];
    for (let player of this.players) {
      player.onTopOut = () => {
        this.music?.stop();
        for (let p2 of this.players) {
          p2.currentState = "pause";
        }
      };
      player.onGameOver = () => {
        for (let p2 of this.players) {
          this.view.removeChild(p2.view);
          p2.destroy();
        }
        // TODO show win screen
        this.onFinish?.();
      };
    }
  }

  async start() {
    for (let player of this.players) {
      this.view.addChild(player.view);
    }
    slideIn(
      this.players[0].view,
      new Point((1 / 4) * WIDTH - this.players[0].view.width / 2, 0),
      LEFT
    );
    slideIn(
      this.players[1].view,
      new Point((3 / 4) * WIDTH - this.players[1].view.width / 2, 0),
      RIGHT
    );

    const countdown = new Countdown();
    this.view.addChild(countdown.view);
    await countdown.start();
    this.view.removeChild(countdown.view);
    for (let player of this.players) {
      player.start();
    }
    this.music = await playSound("bgMusic", { loop: true });
  }

  tick = (time: Ticker) => {
    for (let player of this.players) {
      player.tick(time);
    }
  };
}
