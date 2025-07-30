import moveSound from "./assets/audio/move.ogg";
import turnSound from "./assets/audio/turn.ogg";
import setSound from "./assets/audio/set.ogg";
import swapSound from "./assets/audio/swap.ogg";
import gateSound from "./assets/audio/gate.ogg";
import score1Sound from "./assets/audio/score1.ogg";
import score2Sound from "./assets/audio/score2.ogg";
import score3Sound from "./assets/audio/score3.ogg";
import score4Sound from "./assets/audio/score4.ogg";
import score5Sound from "./assets/audio/score5.ogg";
import clearSound from "./assets/audio/clear.ogg";

export const sounds = {
  move: new Audio(moveSound),
  turn: new Audio(turnSound),
  set: new Audio(setSound),
  swap: new Audio(swapSound),
  clear: new Audio(clearSound),
  gate: new Audio(gateSound),
  score: [score1Sound, score2Sound, score3Sound, score4Sound, score5Sound].map(
    (s) => new Audio(s)
  ),
};
sounds.turn.volume = 0.125;
sounds.move.volume = 0.25;
