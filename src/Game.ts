import { Application } from "pixi.js";
import Player from "./Player";
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
    menu.onStart = (numPlayers) => {
      menu.hide();
      let players: Player[];
      if (numPlayers === 1) {
        players = [
          new Player({
            position: { x: WIDTH / 2 - 250, y: 0 },
            inputMap: {
              a: "left",
              d: "right",
              s: "down",
              e: "rotate",
            },
          }),
        ];
      } else {
        players = [
          new Player({
            position: { x: 0, y: 0 },
            inputMap: {
              a: "left",
              d: "right",
              s: "down",
              e: "rotate",
            },
          }),

          new Player({
            position: { x: WIDTH / 2, y: 0 },
            inputMap: {
              j: "left",
              l: "right",
              k: "down",
              o: "rotate",
            },
          }),
        ];
      }
      for (let player of players) {
        player.onGameOver = () => {
          for (let p2 of players) {
            p2.hide();
            app.ticker.remove(p2.tick);
          }
          menu.show(app.stage);
        };
        player.show(app.stage);
        app.ticker.add(player.tick);
      }
    };
  }
}
