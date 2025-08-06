import { Application } from "pixi.js";
import Qaboom from "./Qaboom";
import Menu from "./Menu";
import { HEIGHT, WIDTH } from "./constants";

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
      qaboom.initialize();
      qaboom.show(app.stage);
      app.ticker.add(qaboom.tick);
    };
    const qaboom = new Qaboom({
      position: { x: 0, y: 0 },
      inputMap: {
        a: "left",
        d: "right",
        s: "down",
        e: "rotate",
      },
    });
    qaboom.onGameOver = () => {
      qaboom.hide();
      app.ticker.remove(qaboom.tick);
      menu.show(app.stage);
    };
  }
}
