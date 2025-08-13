export interface PlayerInput {
  left: string;
  right: string;
  up: string;
  down: string;
  flip: string;
  hold: string;
}
export const inputs = {
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
    right: "k",
    up: "i",
    down: "l",
    flip: "o",
    hold: "u",
  },
};
