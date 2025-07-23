import Game from "./Game";

(async () => {
  // TODO pass in configuration and translations.
  const game = new Game();
  await game.start();
})();
