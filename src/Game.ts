import { Application } from "pixi.js";
import Board from "./Board";

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

    // TODO add the Board and Deck
    const board = new Board();
    app.stage.addChild(board.view);
    app.ticker.add((time) => {
      board.tick(time);
    });
  }
}
