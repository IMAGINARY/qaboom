import move from "./assets/audio/move.ogg";
import turn from "./assets/audio/turn.ogg";
import set from "./assets/audio/set.ogg";
import swap from "./assets/audio/swap.ogg";
import gate from "./assets/audio/gate.ogg";
import score1 from "./assets/audio/score1.ogg";
import score2 from "./assets/audio/score2.ogg";
import score3 from "./assets/audio/score3.ogg";
import score4 from "./assets/audio/score4.ogg";
import score5 from "./assets/audio/score5.ogg";
import clear from "./assets/audio/clear.ogg";
import levelUp from "./assets/audio/levelUp.ogg";
import gameOver from "./assets/audio/gameOver.ogg";
import { sound } from "@pixi/sound";

const soundMap = {
  move,
  turn,
  set,
  swap,
  gate,
  score1,
  score2,
  score3,
  score4,
  score5,
  clear,
  levelUp,
  gameOver,
};
type SoundKey = keyof typeof soundMap;
export function initSounds() {
  for (const [key, path] of Object.entries(soundMap)) {
    sound.add(key, path);
  }
}

export function playSound(key: SoundKey) {
  sound.play(key);
}

export function playScoreSound(level: number) {
  level = Math.max(0, Math.min(4, level));
  sound.play("score" + (level + 1));
}
