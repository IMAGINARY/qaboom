import Game from "./Game";
import { loadLanguages } from "./i18n";

(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  await loadLanguages(["en"], urlParams.get("lang") || "en");
  // load "fake" language for testing translations
  // await loadLanguages(["en", "fake"], urlParams.get("lang") || "en");
  const game = new Game();
  await game.start();
})();
