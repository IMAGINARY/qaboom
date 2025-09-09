import { Point, Container, Graphics, HTMLText } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import { container } from "../util";
import GameNode from "./GameNode";

export default class Credits extends GameNode {
  onFinish?: () => void;

  constructor() {
    super();
    document.addEventListener("keydown", this.handleKeyDown);
    this.view.position.x = WIDTH / 2;
    this.view.position.y = HEIGHT / 2;

    const boxHeight = HEIGHT * 0.9;
    const boxWidth = WIDTH * 0.9;
    this.view.addChild(
      container(
        new Graphics().roundRect(
          -boxWidth / 2,
          -boxHeight / 2,
          boxWidth,
          boxHeight
        )
      )
    );
    const titleText = new HTMLText({
      text: "Credits",
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 72,
      },
    });
    titleText.anchor = { x: 0.5, y: 0.5 };
    titleText.position.y = -HEIGHT / 2 + 144;
    this.view.addChild(titleText);

    const width = WIDTH * 0.2;
    this.drawCredit(
      new Point(-width, -HEIGHT * 0.3),
      "Concept & Development",
      "Nat Alison"
    );

    this.drawCredit(
      new Point(-width, -HEIGHT * 0.2),
      "Content & Coordination",
      "Christian Stussak",
      "Andreas Matt",
      "Skye Rosenstein"
    );
    this.drawCredit(new Point(-width, HEIGHT * 0), "Music", "Landis Seralian");
    this.drawCredit(
      new Point(width, -HEIGHT * 0.3),
      "Support",
      "Karla Schön",
      "Oliver Schön"
    );
    this.drawCredit(
      new Point(width, -HEIGHT * 0.15),
      "Arcade Machine Graphic Design",
      "Eric Londaits"
    );
    this.drawCredit(
      new Point(width, HEIGHT * 0),
      "Arcade Machine Building",
      "Retr-O-Mat"
    );
    this.drawCredit(new Point(0, HEIGHT * 0.1), "Funded by", "BMFTR");
  }

  drawCredit(position: Point, title: string, ...names: string[]) {
    const credit = new Container();
    credit.position = position;
    this.view.addChild(credit);
    const titleText = new HTMLText({
      text: title,
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 40,
      },
    });
    titleText.anchor = { x: 0.5, y: 0 };
    credit.addChild(titleText);

    for (let [i, name] of names.entries()) {
      const nameText = new HTMLText({
        text: name,
        style: {
          align: "center",
          fill: theme.colors.muted,
          fontFamily: TEXT_FONT,
          fontWeight: "bold",
          fontSize: 40,
        },
      });
      nameText.anchor = { x: 0.5, y: 0 };
      nameText.position.y = (i + 1) * 50;
      credit.addChild(nameText);
    }
  }

  handleKeyDown = () => {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.onFinish?.();
  };
}
