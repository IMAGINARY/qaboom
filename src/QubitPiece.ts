import { Container, Graphics, Ticker } from "pixi.js";
import { getBlochCoords, randomQubit, type Qubit } from "./quantum";
import { PIECE_RADIUS } from "./constants";
import { getColor } from "./colors";
import { floatEquals, floatGreaterThan } from "./math";
// A qubit is the basic "piece" that exists in the grid.
// It has a 3D rotation and amplitude, which are represented in 2D
// using colors.
const rate = 500;
export default class QubitPiece {
  // The qubit value
  value: Qubit;
  sprite: Container;
  circle: Graphics;
  rod: Graphics;
  outline: Graphics;

  #goal: { theta: number; phi: number };
  #current: { theta: number; phi: number };
  #alpha = 0;

  constructor(value: Qubit) {
    this.value = value;
    this.sprite = new Graphics();
    this.circle = new Graphics().circle(0, 0, PIECE_RADIUS).fill("white");
    this.rod = new Graphics()
      .moveTo(0, 0)
      .lineTo(0, PIECE_RADIUS)
      .stroke({ color: "white", width: 2 });
    this.outline = new Graphics()
      .circle(0, 0, PIECE_RADIUS)
      .stroke({ color: "white", width: 1 });
    this.sprite.addChild(this.circle);
    this.sprite.addChild(this.rod);
    this.sprite.addChild(this.outline);
    this.#current = getBlochCoords(value);
    this.#goal = this.#current;
    this.setSprite(this.#current);
  }

  // return a random qubit
  static random() {
    return new QubitPiece(randomQubit());
  }

  tick(time: Ticker) {
    this.#alpha = Math.min(1, this.#alpha + time.deltaMS / rate);
    if (this.#alpha >= 1) {
      return;
    }
    this.#current.phi =
      this.#current.phi * (1 - this.#alpha) + this.#goal.phi * this.#alpha;
    this.#current.theta =
      this.#current.theta * (1 - this.#alpha) + this.#goal.theta * this.#alpha;

    this.setSprite(this.#current);
  }

  setValue(value: Qubit) {
    this.value = value;
    this.#goal = getBlochCoords(value);
    // Make sure the angle moves in the shortest route
    if (Math.abs(this.#current.phi - this.#goal.phi) > Math.PI) {
      if (this.#current.phi > Math.PI) {
        this.#current.phi -= 2 * Math.PI;
      } else {
        this.#current.phi += 2 * Math.PI;
      }
    }
    // Handle black/white edge cases
    if (
      floatEquals(this.#goal.theta, 0) ||
      floatEquals(this.#goal.theta, Math.PI)
    ) {
      this.#goal.phi = this.#current.phi;
    }
    if (
      floatEquals(this.#current.theta, 0) ||
      floatEquals(this.#current.theta, Math.PI)
    ) {
      this.#current.phi = this.#goal.phi;
    }
    this.#alpha = 0;
  }

  setSprite({ phi, theta }: { phi: number; theta: number }) {
    const length = Math.sin(theta);
    const secondaryColor = floatGreaterThan(theta, Math.PI / 2)
      ? "black"
      : "white";
    this.circle.tint = getColor({ phi, theta });
    this.rod.rotation = phi;
    this.rod.tint = secondaryColor;
    this.rod.scale.y = length;
    this.outline.tint = secondaryColor;
  }
}
