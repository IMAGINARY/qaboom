import Game from "./Game";
import { loadLanguages } from "./i18n";

(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  await loadLanguages(["en"], urlParams.get("lang") || "en");
  // load more languages for testing translations
  // await loadLanguages(["en", "de"], urlParams.get("lang") || "en");
  const game = new Game();
  await game.start();
})();
