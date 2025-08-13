import { type Ticker } from "pixi.js";
import { WIDTH } from "./constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { freeMode } from "./levels";
import Background from "./Background";
import { inputs } from "./inputs";

export default class Multiplayer extends GameNode {
  players: Player[];
  background: Background;
  onFinish?: () => void;

  constructor() {
    super();
    this.background = new Background();
    this.view.addChild(this.background.view);
    this.players = [
      new Player({
        position: { x: 0, y: 0 },
        inputMap: inputs.player1,
        levels: [freeMode],
      }),

      new Player({
        position: { x: WIDTH / 2, y: 0 },
        inputMap: inputs.player2,
        levels: [freeMode],
      }),
    ];

    for (let player of this.players) {
      player.onGameOver = () => {
        for (let p2 of this.players) {
          this.view.removeChild(p2.view);
          p2.hide();
        }
        // TODO show win screen
        this.onFinish?.();
      };
      this.view.addChild(player.view);
      player.show();
    }
  }

  show() {
    for (let player of this.players) {
      player.show();
    }
  }

  tick = (time: Ticker) => {
    for (let player of this.players) {
      player.tick(time);
    }
  };
}
