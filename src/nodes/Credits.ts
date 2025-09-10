import { Point, Container, Graphics, HTMLText, Assets, Sprite } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import { container } from "../util";
import GameNode from "./GameNode";
import ministryLogoPath from "../assets/img/ministry-logo.png";
import imaginaryLogoPath from "../assets/img/imaginary-logo.png";
import mpiLogoPath from "../assets/img/mpi-logo.png";
import { inputs } from "../inputs";

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
          boxHeight - 350
        )
      )
    );
    this.view.addChild(
      container(
        new Graphics().roundRect(
          -boxWidth / 2,
          boxHeight / 2 - 350,
          boxWidth,
          350
        )
      ).fill("white")
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
      "Skye Rothstein"
    );
    this.drawCredit(new Point(-width, HEIGHT * 0), "Music", "Landis Seralian");
    this.drawCredit(
      new Point(width, -HEIGHT * 0.3),
      "Support",
      "Karla Schön",
      "Oliver Schön"
    );
    this.drawCredit(
      new Point(width, -HEIGHT * 0.125),
      "Arcade Machine Graphic Design",
      "Eric Londaits"
    );
    this.drawCredit(
      new Point(width, HEIGHT * 0),
      "Arcade Machine Building",
      "Retr-O-Mat"
    );
    // this.drawCredit(new Point(0, HEIGHT * 0.1), "Funded by", "BMFTR");
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

  handleKeyDown = (e: KeyboardEvent) => {
    if (
      [
        ...Object.values(inputs.player1),
        ...Object.values(inputs.player2),
      ].includes(e.key)
    ) {
      document.removeEventListener("keydown", this.handleKeyDown);
      this.onFinish?.();
    }
  };

  async load() {
    const fundedBy = new Container();
    fundedBy.position = { x: -WIDTH * 0.3, y: HEIGHT * 0.2 };
    const ministryLogoTexture = await Assets.load(ministryLogoPath);
    const titleText = new HTMLText({
      text: "Funded by",
      style: {
        align: "center",
        fill: "black",
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 40,
      },
    });
    titleText.anchor = { x: 0.5, y: 0 };
    fundedBy.addChild(titleText);
    const sprite = new Sprite(ministryLogoTexture);
    sprite.anchor = { x: 0.5, y: 0 };
    sprite.position.y = 50;
    sprite.scale = 0.3;
    fundedBy.addChild(sprite);
    this.view.addChild(fundedBy);

    const partOf = new Container();
    partOf.position = { x: WIDTH * 0.1, y: HEIGHT * 0.2 };
    const imaginaryLogoTexture = await Assets.load(imaginaryLogoPath);
    const mpiLogoTexture = await Assets.load(mpiLogoPath);
    const titleText2 = new HTMLText({
      text: "Part of quantum-arcade.org by",
      style: {
        align: "center",
        fill: "black",
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 40,
      },
    });
    titleText2.anchor = { x: 0.5, y: 0 };
    partOf.addChild(titleText2);
    const sprite1 = new Sprite(imaginaryLogoTexture);
    sprite1.anchor = { x: 0.5, y: 0 };
    sprite1.position = { x: -300, y: 100 };
    sprite1.scale = 0.5;
    const sprite2 = new Sprite(mpiLogoTexture);
    sprite2.anchor = { x: 0.5, y: 0 };
    sprite2.position = { x: 300, y: 50 };
    sprite2.scale = 0.5;
    partOf.addChild(sprite1);
    partOf.addChild(sprite2);
    this.view.addChild(partOf);
  }
}
