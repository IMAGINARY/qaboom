import { Application, Assets } from "pixi.js";
import Menu from "./nodes/Menu";
import { HEIGHT, WIDTH } from "./constants";
import SinglePlayer from "./nodes/SinglePlayer";
import Multiplayer from "./nodes/Multiplayer";
import Background from "./nodes/Background";
import { initSounds } from "./audio";
import { inputs } from "./inputs";
import ministryLogoPath from "./assets/img/ministry-logo.png";
import IdleMode from "./nodes/IdleMode";
import { randomInt } from "mathjs";
import { campaign } from "./levels";

const IDLE_TIMEOUT = 60 * 1000;

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

    let timeout: number;
    function setIdleTimeout() {
      timeout = setTimeout(() => {
        menu.hide();
        const idleMode = new IdleMode(
          background,
          randomInt(0, campaign.length)
        );
        idleMode.onFinish = () => {
          app.ticker.remove(idleMode.tick);
          app.stage.removeChild(idleMode.view);
          showMenu();
        };
        app.stage.addChild(idleMode.view);
        idleMode.start();
        app.ticker.add(idleMode.tick);
      }, IDLE_TIMEOUT);
    }
    const resetIdleTimeout = () => {
      clearTimeout(timeout);
      setIdleTimeout();
    };
    const showMenu = () => {
      menu.show(app.stage);
      setIdleTimeout();
      document.addEventListener("keydown", resetIdleTimeout);
    };

    showMenu();
    menu.onStart = (numPlayers, level) => {
      document.removeEventListener("keydown", resetIdleTimeout);
      clearTimeout(timeout);
      menu.hide();
      if (numPlayers === 1) {
        const singlePlayer = new SinglePlayer(background, level);
        singlePlayer.onFinish = () => {
          app.ticker.remove(singlePlayer.tick);
          app.stage.removeChild(singlePlayer.view);
          showMenu();
        };
        app.stage.addChild(singlePlayer.view);
        singlePlayer.start();
        app.ticker.add(singlePlayer.tick);
      } else {
        const multiplayer = new Multiplayer(background, level);
        multiplayer.onFinish = () => {
          app.ticker.remove(multiplayer.tick);
          app.stage.removeChild(multiplayer.view);
          showMenu();
        };
        app.stage.addChild(multiplayer.view);
        multiplayer.start();
        app.ticker.add(multiplayer.tick);
      }
    };
  }
}
