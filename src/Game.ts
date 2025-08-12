import { Application } from "pixi.js";
import Menu from "./Menu";
import { HEIGHT, WIDTH } from "./constants";
import SinglePlayer from "./SinglePlayer";
import Multiplayer from "./Multiplayer";

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
    document.body.appendChild(app.canvas);

    const menu = new Menu();
    menu.show(app.stage);
    menu.onStart = (numPlayers) => {
      menu.hide();
      if (numPlayers === 1) {
        const singlePlayer = new SinglePlayer();
        singlePlayer.onFinish = () => {
          app.ticker.remove(singlePlayer.tick);
          app.stage.removeChild(singlePlayer.view);
          menu.show(app.stage);
        };
        app.stage.addChild(singlePlayer.view);
        singlePlayer.show();
        app.ticker.add(singlePlayer.tick);
      } else {
        const multiplayer = new Multiplayer();
        multiplayer.onFinish = () => {
          app.ticker.remove(multiplayer.tick);
          app.stage.removeChild(multiplayer.view);
          menu.show(app.stage);
        };
        app.stage.addChild(multiplayer.view);
        multiplayer.show();
        app.ticker.add(multiplayer.tick);
      }
    };
  }
}
