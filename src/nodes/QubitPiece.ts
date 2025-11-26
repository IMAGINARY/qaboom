import { Container, Graphics, Ticker } from "pixi.js";
import { getBlochCoords, randomQubit, type Qubit } from "../quantum";
import { PIECE_RADIUS, theme } from "../constants";
import { getColor, getSecondaryColor } from "../colors";
import { floatEquals } from "../math";
import GameNode from "./GameNode";
import { animate } from "motion";
import { pulse } from "../animations";

// Rate at which qubit changes colors
const rate = 1000;

// A qubit is the basic "piece" that exists in the grid.
// It has a 3D rotation and amplitude, which are represented in 2D
// using colors.
export default class QubitPiece extends GameNode {
  // The qubit value
  value: Qubit;
  // Container for internal stuff for animation;
  container: Container;
  circle: Graphics;
  rod: Graphics;
  outline: Graphics;

  #goal: { theta: number; phi: number };
  #current: { theta: number; phi: number };
  #alpha = 0;

  constructor(value: Qubit) {
    super();
    this.container = new Container();
    this.value = value;
    this.circle = new Graphics()
      .circle(0, 0, PIECE_RADIUS)
      .fill(theme.colors.primary);
    this.rod = new Graphics().moveTo(0, 0).lineTo(0, PIECE_RADIUS).stroke({
      color: theme.colors.primary,
      width: 3,
      cap: "round",
    });
    this.outline = new Graphics()
      .circle(0, 0, PIECE_RADIUS)
      .stroke({ color: theme.colors.primary, width: 2 });
    this.container.addChild(this.circle);
    this.container.addChild(this.rod);
    this.container.addChild(this.outline);
    this.view.addChild(this.container);
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

  bounce() {
    pulse(this.container);
  }

  bounceIn() {
    pulse(this.container, 0.85);
  }

  async destroy() {
    // await animate(this.container.scale, { x: 0, y: 0 }, { duration: 0.15 });
    this.view.removeChild(this.container);
    const numBubbles = 8;
    const explodeRadius = PIECE_RADIUS;
    const explodeContainers = [];
    const explodeBits: Graphics[] = [];
    const coords = getBlochCoords(this.value);
    for (let i = 0; i < numBubbles; i++) {
      const container = new Container();
      const circle = new Graphics()
        .circle(0, 0, PIECE_RADIUS / 4)
        .fill(getColor(coords))
        .stroke(getSecondaryColor(coords));
      container.rotation = i * ((2 * Math.PI) / numBubbles);
      circle.scale = 0;
      explodeContainers.push(container);
      explodeBits.push(circle);
      this.view.addChild(container);
      container.addChild(circle);
    }

    await Promise.all(
      explodeBits.map((circle) => {
        return animate([
          [
            circle.position,
            { x: explodeRadius },
            { ease: "easeOut", duration: 0.4 },
          ],
          [
            circle.scale,
            { x: 1, y: 1 },
            { ease: "easeOut", duration: 0.2, at: 0 },
          ],
          [circle.scale, { x: 0, y: 0 }, { ease: "easeIn", duration: 0.2 }],
        ]);
      })
    );
  }

  setSprite({ phi, theta }: { phi: number; theta: number }) {
    const length = Math.sin(theta);
    const secondaryColor = getSecondaryColor({ phi, theta });
    this.circle.tint = getColor({ phi, theta });
    this.rod.rotation = phi;
    this.rod.tint = secondaryColor;
    this.rod.scale.y = length;
    this.outline.tint = secondaryColor;
  }
}
