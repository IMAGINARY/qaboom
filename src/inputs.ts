export interface PlayerInput {
  left: string;
  right: string;
  up: string;
  down: string;
  flip: string;
  hold: string;
}
export const inputs = {
  pause: "p",
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
