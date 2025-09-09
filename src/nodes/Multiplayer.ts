import { Point, type Ticker } from "pixi.js";
import { HEIGHT, WIDTH } from "../constants";
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
import ScoreScreen from "./ScoreScreen";

type State = "game" | "end";
export default class Multiplayer extends GameNode {
  players: Player[];
  background: Background;
  onFinish?: () => void;
  music?: IMediaInstance;
  state: State = "game";
  outPlayers: number[] = [];
  scoreFinishPlayers: number[] = [];

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
    for (let [index, player] of this.players.entries()) {
      player.onTopOut = () => {
        this.outPlayers.push(index);
        if (this.outPlayers.length === 2) {
          this.music?.stop();
        }
      };
      player.onGameOver = (score) => {
        this.view.removeChild(player.view);
        player.destroy();
        const scores = new ScoreScreen(
          score * 100,
          inputs[index === 0 ? "player1" : "player2"]
        );
        scores.view.position = {
          x: WIDTH * (index === 0 ? 0.25 : 0.75),
          y: HEIGHT / 2,
        };
        this.view.addChild(scores.view);
        scores.onFinish = () => {
          this.view.removeChild(scores.view);
          scores.destroy();
          this.scoreFinishPlayers.push(index);
          if (this.scoreFinishPlayers.length === 2) {
            this.onFinish?.();
          }
        };
        scores.start();
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
