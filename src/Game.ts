import { Application } from "pixi.js";
import Board from "./Board";
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
      board.initialize();
      board.show(app.stage);
      app.ticker.add(board.tick);
    };
    const board = new Board();
    board.onGameOver = () => {
      board.hide();
      app.ticker.remove(board.tick);
      menu.show(app.stage);
    };
  }
}
