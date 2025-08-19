import { Application, Assets } from "pixi.js";
import Menu from "./nodes/Menu";
import { HEIGHT, WIDTH } from "./constants";
import SinglePlayer from "./nodes/SinglePlayer";
import Multiplayer from "./nodes/Multiplayer";
import Background from "./nodes/Background";
import { initSounds } from "./audio";
import { inputs } from "./inputs";
import ministryLogoPath from "./assets/img/ministry-logo.png";

export default class Game {
  async start() {
    initSounds();
    const app = new Application();

    // Initialize the application
    await app.init({
      antialias: true,
      background: "#000",
      width: WIDTH,
      height: HEIGHT,
    });

    const ministryLogoTexture = await Assets.load(ministryLogoPath);

    // Append the application canvas to the document body
    document.getElementById("app")!.appendChild(app.canvas);

    // Button to manually refresh the app
    document.addEventListener("keydown", (e) => {
      if (e.key === inputs.refresh) {
        window.location.reload();
      }
    });

    const background = new Background();

    const menu = new Menu(background, ministryLogoTexture);
    app.stage.addChild(background.view);
    app.ticker.add(background.tick);
    menu.show(app.stage);
    menu.onStart = (numPlayers, level) => {
      menu.hide();
      if (numPlayers === 1) {
        const singlePlayer = new SinglePlayer(background, level);
        singlePlayer.onFinish = () => {
          app.ticker.remove(singlePlayer.tick);
          app.stage.removeChild(singlePlayer.view);
          menu.show(app.stage);
        };
        app.stage.addChild(singlePlayer.view);
        singlePlayer.start();
        app.ticker.add(singlePlayer.tick);
      } else {
        const multiplayer = new Multiplayer(background, level);
        multiplayer.onFinish = () => {
          app.ticker.remove(multiplayer.tick);
          app.stage.removeChild(multiplayer.view);
          menu.show(app.stage);
        };
        app.stage.addChild(multiplayer.view);
        multiplayer.start();
        app.ticker.add(multiplayer.tick);
      }
    };
  }
}
