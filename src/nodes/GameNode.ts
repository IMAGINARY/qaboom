import { Container, type Ticker } from "pixi.js";

// A basic game node.
export default abstract class GameNode {
  view: Container;

  constructor() {
    this.view = new Container();
  }

  tick(_time: Ticker) {}
}
