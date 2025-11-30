import { difference } from "lodash-es";

export type Input = string;
type Callback = (input: Input) => void;

// Singleton that unifies keyboard and gamepad inputs
class InputManager {
  keydownCallbacks: Callback[] = [];
  keyupCallbacks: Callback[] = [];

  // All currently pressed keys on gamepad
  gamepadPressed: Input[] = [];

  constructor() {
    document.addEventListener("keydown", (e) => {
      for (let cb of this.keydownCallbacks) {
        cb(keyInputs[e.key]);
      }
    });
    document.addEventListener("keyup", (e) => {
      for (let cb of this.keyupCallbacks) {
        cb(keyInputs[e.key]);
      }
    });
  }

  tick() {
    // On each tick, fire `keydown` events for each newly pressed gamepad button
    // and fire `keyup` events for each released button
    const gamepads = navigator.getGamepads();
    let newInputs: Input[] = [];
    if (gamepads[0]) {
      newInputs = newInputs.concat(
        this.getGamepadButtons("player1", gamepads[0])
      );
    }
    if (gamepads[1]) {
      newInputs = newInputs.concat(
        this.getGamepadButtons("player2", gamepads[1])
      );
    }
    for (let input of difference(this.gamepadPressed, newInputs)) {
      for (let cb of this.keyupCallbacks) {
        cb(input);
      }
    }
    for (let input of difference(newInputs, this.gamepadPressed)) {
      for (let cb of this.keydownCallbacks) {
        cb(input);
      }
    }

    this.gamepadPressed = newInputs;
  }

  getGamepadButtons(playerIndex: string, gp: Gamepad) {
    const buttons = [];
    if (gp.axes[0] < -0.5 || gp.buttons[14].pressed) {
      buttons.push(`${playerIndex}.left`);
    }
    if (gp.axes[0] > 0.5 || gp.buttons[15].pressed) {
      buttons.push(`${playerIndex}.right`);
    }
    if (gp.axes[1] < -0.5 || gp.buttons[12].pressed) {
      buttons.push(`${playerIndex}.up`);
    }
    if (gp.axes[1] > 0.5 || gp.buttons[13].pressed) {
      buttons.push(`${playerIndex}.down`);
    }
    if (gp.buttons[0].pressed) {
      buttons.push(`${playerIndex}.flip`);
    }
    if (gp.buttons[1].pressed) {
      buttons.push(`${playerIndex}.hold`);
    }
    return buttons;
  }

  addKeydownListener(cb: Callback) {
    this.keydownCallbacks.push(cb);
  }

  removeKeydownListener(cb: Callback) {
    const index = this.keydownCallbacks.indexOf(cb);
    if (index >= 0) {
      this.keydownCallbacks.splice(index, 1);
    }
  }

  addKeyupListener(cb: Callback) {
    this.keyupCallbacks.push(cb);
  }

  removeKeyupListener(cb: Callback) {
    const index = this.keydownCallbacks.indexOf(cb);
    if (index >= 0) {
      this.keyupCallbacks.splice(index, 1);
    }
  }
}

export const inputManager = new InputManager();

export const playerInputs = ["up", "down", "left", "right", "flip", "hold"];

const keyInputs: Record<string, string> = {
  r: "refresh",
  p: "pause",
  t: "translate",
  a: "player1.left",
  d: "player1.right",
  w: "player1.up",
  s: "player1.down",
  e: "player1.flip",
  q: "player1.hold",
  j: "player2.left",
  l: "player2.right",
  i: "player2.up",
  k: "player2.down",
  o: "player2.flip",
  u: "player2.hold",
};
