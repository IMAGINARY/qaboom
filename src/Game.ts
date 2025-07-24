import { Application } from "pixi.js";
import Qaboom from "./Qaboom";
import Menu from "./Menu";

export default class Game {
  async start() {
    const app = new Application();

    // Initialize the application
    await app.init({
      background: "#000",
      width: 500,
      height: 700,
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
    const qaboom = new Qaboom();
    qaboom.onGameOver = () => {
      qaboom.hide();
      app.ticker.remove(qaboom.tick);
      menu.show(app.stage);
    };
  }
}
