export interface PlayerInput {
  left: string;
  right: string;
  up: string;
  down: string;
  flip: string;
  hold: string;
}

export type Input = string;
type Callback = (input: Input) => void;

class InputManager {
  keydownCallbacks: Callback[] = [];
  keyupCallbacks: Callback[] = [];

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

  // TODO add gamepads
}

export const inputManager = new InputManager();

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

export const inputs = {
  refresh: "r",
  pause: "p",
  translate: "t",
  player1: {
    left: "a",
    right: "d",
    up: "w",
    down: "s",
    flip: "e",
    hold: "q",
  },
  player2: {
    left: "j",
    right: "l",
    up: "i",
    down: "k",
    flip: "o",
    hold: "u",
  },
};
