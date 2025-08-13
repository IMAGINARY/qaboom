import { type Ticker } from "pixi.js";
import { WIDTH } from "./constants";
import GameNode from "./GameNode";
import Player from "./Player";
import { campaign } from "./levels";
import Background from "./Background";
import { inputs } from "./inputs";

export default class SinglePlayer extends GameNode {
  player: Player;
  onFinish?: () => void;
  background: Background;

  constructor() {
    super();
    this.background = new Background();
    this.view.addChild(this.background.view);
    this.player = new Player({
      position: { x: WIDTH / 2 - 250, y: 0 },
      inputMap: inputs.player1,
      levels: campaign,
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
