import "@pixi/layout";
import { Container, HTMLText, Assets, Sprite, Texture } from "pixi.js";
import { HEIGHT, TEXT_FONT, theme, WIDTH } from "../constants";
import GameNode from "./GameNode";
import ministryLogoPath from "../assets/img/ministry-logo.png";
import imaginaryLogoPath from "../assets/img/imaginary-logo.png";
import mpiLogoPath from "../assets/img/mpi-logo.png";
import { inputs } from "../inputs";
import { LayoutContainer } from "@pixi/layout/components";
import { setI18nKey } from "../i18n";

export default class Credits extends GameNode {
  onFinish?: () => void;

  constructor() {
    super();
    document.addEventListener("keydown", this.handleKeyDown);
    this.view.layout = {
      width: WIDTH,
      height: HEIGHT,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 50,
    };
    const credits = new LayoutContainer({
      layout: {
        padding: 50,
        borderRadius: 20,
        backgroundColor: "#0008",
        borderColor: "white",
        borderWidth: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      },
    });
    this.view.addChild(credits);

    const titleText = new HTMLText({
      layout: true,
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 72,
      },
    });
    setI18nKey(titleText, "credits.title");
    credits.addChild(titleText);

    const columns = new Container({
      layout: {
        display: "flex",
        gap: 75,
      },
    });
    credits.addChild(columns);

    const column1 = new Container({
      layout: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
      },
    });
    const column2 = new Container({
      layout: {
        display: "flex",
        flexDirection: "column",
        gap: 20,
      },
    });

    columns.addChild(column1);
    columns.addChild(column2);

    column1.addChild(
      this.drawCredit("credits.concept_development", "Nat Alison")
    );

    column1.addChild(
      this.drawCredit(
        "credits.content_coord",
        "Christian Stussak",
        "Andreas Matt",
        "Skye Rothstein"
      )
    );
    column1.addChild(this.drawCredit("credits.music", "Landis Seralian"));

    column2.addChild(
      this.drawCredit("credits.support", "Karla Schön", "Oliver Schön")
    );
    column2.addChild(
      this.drawCredit("credits.graphic_design", "Eric Londaits")
    ),
      column2.addChild(this.drawCredit("credits.building", "Retr-O-Mat"));
  }

  drawCredit(key: string, ...names: string[]) {
    const credit = new Container({
      layout: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },
    });
    const titleText = new HTMLText({
      layout: true,
      style: {
        align: "center",
        fill: theme.colors.primary,
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 40,
      },
    });
    setI18nKey(titleText, key);
    credit.addChild(titleText);

    for (let [_i, name] of names.entries()) {
      const nameText = new HTMLText({
        layout: true,
        text: name,
        style: {
          align: "center",
          fill: theme.colors.muted,
          fontFamily: TEXT_FONT,
          fontWeight: "bold",
          fontSize: 40,
        },
      });
      credit.addChild(nameText);
    }
    return credit;
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
    const logos = new LayoutContainer({
      layout: {
        backgroundColor: "white",
        borderRadius: 20,
        display: "flex",
        gap: 100,
        padding: 50,
      },
    });

    const fundedBy = new Container({
      layout: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },
    });
    const ministryLogoTexture = await Assets.load(ministryLogoPath);
    const titleText = new HTMLText({
      layout: true,
      style: {
        align: "center",
        fill: "black",
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 40,
      },
    });
    setI18nKey(titleText, "credits.funded_by");
    fundedBy.addChild(titleText);
    fundedBy.addChild(this.drawImage(ministryLogoTexture, 250));
    logos.addChild(fundedBy);

    const partOf = new Container({
      layout: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      },
    });
    const imaginaryLogoTexture = await Assets.load(imaginaryLogoPath);
    const mpiLogoTexture = await Assets.load(mpiLogoPath);
    const titleText2 = new HTMLText({
      layout: true,
      style: {
        align: "center",
        fill: "black",
        fontFamily: TEXT_FONT,
        fontWeight: "bold",
        fontSize: 40,
      },
    });
    setI18nKey(titleText2, "credits.part_of");
    partOf.addChild(titleText2);
    const partOfSprites = new Container({
      layout: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      },
    });
    partOfSprites.addChild(this.drawImage(imaginaryLogoTexture, 300));
    partOfSprites.addChild(this.drawImage(mpiLogoTexture, 500));
    partOf.addChild(partOfSprites);
    logos.addChild(partOf);
    this.view.addChild(logos);
  }

  drawImage(texture: Texture, width: number) {
    return new Sprite({
      texture,
      layout: {
        width,
        height: (width * texture.height) / texture.width,
      },
    });
  }
}
