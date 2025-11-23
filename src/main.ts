import Game from "./Game";
import { loadLanguages } from "./i18n";

(async () => {
  await loadLanguages(["en"]);
  // load "fake" language for testing translations
  // await loadLanguages(["en", "fake"]);
  const game = new Game();
  await game.start();
})();
