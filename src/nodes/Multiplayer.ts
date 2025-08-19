import { HTMLText, Point, type Ticker } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
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

type State = "game" | "end";
export default class Multiplayer extends GameNode {
  players: Player[];
  background: Background;
  onFinish?: () => void;
  music?: IMediaInstance;
  state: State = "game";

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
        this.music?.stop();
        for (let p2 of this.players) {
          p2.currentState = "pause";
        }
      };
      player.onGameOver = () => {
        playSound("ending");
        const text = new HTMLText({
          text: `Player ${2 - index} Wins!`,
          style: {
            fontSize: 72,
            fontFamily: TEXT_FONT,
            fill: theme.colors.primary,
            stroke: { color: theme.colors.background, width: 10 },
            fontWeight: "bold",
          },
        });
        text.anchor = { x: 0.5, y: 0.5 };
        text.position = {
          x: (index === 0 ? 1 / 4 : 3 / 4) * WIDTH,
          y: HEIGHT / 2,
        };
        this.view.addChild(text);
        this.state = "end";
        // for (let p2 of this.players) {
        //   this.view.removeChild(p2.view);
        //   p2.destroy();
        // }
        // // TODO show win screen
        // this.onFinish?.();
      };
    }
  }

  async start() {
    document.addEventListener("keydown", this.handleKeyDown);
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

  handleKeyDown = () => {
    if (this.state !== "end") {
      return;
    }
    for (let p2 of this.players) {
      this.view.removeChild(p2.view);
      p2.destroy();
    }
    document.removeEventListener("keydown", this.handleKeyDown);
    this.onFinish?.();
    // End the game
  };

  tick = (time: Ticker) => {
    for (let player of this.players) {
      player.tick(time);
    }
  };
}
