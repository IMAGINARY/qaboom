import { Application } from "pixi.js";
import Qaboom from "./Qaboom";
import Menu from "./Menu";
import { BOARD_WIDTH, HEIGHT, WIDTH } from "./constants";

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
    menu.onStart = () => {
      menu.hide();
      player1.initialize();
      player1.show(app.stage);
      player2.initialize();
      player2.show(app.stage);
      app.ticker.add(player1.tick);
      app.ticker.add(player2.tick);
    };
    const player1 = new Qaboom({
      position: { x: 0, y: 0 },
      inputMap: {
        a: "left",
        d: "right",
        s: "down",
        e: "rotate",
      },
    });

    const player2 = new Qaboom({
      position: { x: WIDTH / 2, y: 0 },
      inputMap: {
        j: "left",
        l: "right",
        k: "down",
        o: "rotate",
      },
    });
    player1.onGameOver = () => {
      player1.hide();
      player2.hide();
      app.ticker.remove(player1.tick);
      app.ticker.remove(player2.tick);
      menu.show(app.stage);
    };
    player2.onGameOver = () => {
      player1.hide();
      player2.hide();
      app.ticker.remove(player1.tick);
      app.ticker.remove(player2.tick);
      menu.show(app.stage);
    };
  }
}
