import type { Ticker } from "pixi.js";
import { WIDTH } from "./constants";
import GameNode from "./GameNode";
import Player from "./Player";

export default class SinglePlayer extends GameNode {
  player: Player;
  onFinish?: () => void;

  constructor() {
    super();
    this.player = new Player({
      position: { x: WIDTH / 2 - 250, y: 0 },
      inputMap: {
        a: "left",
        d: "right",
        s: "down",
        e: "rotate",
      },
    });
    this.view.addChild(this.player.view);

    this.player.onGameOver = () => {
      this.view.removeChild(this.player.view);
      this.player.hide();
      // TODO show a high score screen first
      this.onFinish?.();
    };
  }

  show() {
    this.player.show();
  }

  tick = (time: Ticker) => {
    this.player.tick(time);
  };
}
