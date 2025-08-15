import { HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "./constants";
import GameNode from "./GameNode";
import { sounds } from "./audio";
import { delay } from "./util";
import { pulse } from "./animations";

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
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 256,
      },
    });
    this.text.anchor = { x: 0.5, y: 0.5 };
    this.view.addChild(this.text);
  }

  async start() {
    for (let count = 3; count > 0; count--) {
      this.text.text = count;
      sounds.score[3 - count].play();
      pulse(this.text, 1.5);
      await delay(1000 * (5 / 8));
    }
    this.text.text = "GO!";
    sounds.levelUp.load();
    sounds.levelUp.play();
    await delay(1000);
  }
}
