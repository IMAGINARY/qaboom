import { HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import GameNode from "./GameNode";
import { playScoreSound, playSound } from "../audio";
import { delay } from "../util";
import { pulse } from "../animations";
import { setI18nKey } from "../i18n";

export default class Countdown extends GameNode {
  text: HTMLText;
  count = 3;
  constructor() {
    super();
    this.view.position = { x: WIDTH / 2, y: HEIGHT / 2 };
    this.text = new HTMLText({
      text: "",
      style: {
        fill: theme.colors.primary,
        stroke: { color: theme.colors.background, width: 10 },
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 256,
      },
    });
    this.text.anchor = { x: 0.5, y: 0.5 };
    this.view.addChild(this.text);
  }

  async start() {
    await delay(250);
    for (let count = 3; count > 0; count--) {
      this.text.text = count;
      playScoreSound(3 - count);
      pulse(this.text, 1.5);
      await delay(1000 * (5 / 8));
    }
    setI18nKey(this.text, "game.go");
    playSound("levelUp");
    await delay(1000);
  }
}
