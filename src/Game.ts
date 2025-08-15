import { Application } from "pixi.js";
import Menu from "./Menu";
import { HEIGHT, WIDTH } from "./constants";
import SinglePlayer from "./SinglePlayer";
import Multiplayer from "./Multiplayer";
import Background from "./Background";

export default class Game {
  async start() {
    const app = new Application();

    // Initialize the application
    await app.init({
      antialias: true,
      background: "#000",
      width: WIDTH,
      height: HEIGHT,
    });

    // Append the application canvas to the document body
    document.getElementById("app")!.appendChild(app.canvas);

    const background = new Background();

    const menu = new Menu();
    app.stage.addChild(background.view);
    app.ticker.add(background.tick);
    menu.show(app.stage);
    menu.onStart = (numPlayers) => {
      menu.hide();
      if (numPlayers === 1) {
        const singlePlayer = new SinglePlayer(background);
        singlePlayer.onFinish = () => {
          app.ticker.remove(singlePlayer.tick);
          app.stage.removeChild(singlePlayer.view);
          menu.show(app.stage);
        };
        app.stage.addChild(singlePlayer.view);
        singlePlayer.start();
        app.ticker.add(singlePlayer.tick);
      } else {
        const multiplayer = new Multiplayer(background);
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
