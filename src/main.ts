import { Application, Graphics } from "pixi.js";

(async () => {
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#000", width: 500, height: 700 });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  const graphics = new Graphics().rect(100, 100, 100, 100).fill(0xff0000);
  graphics.pivot.set(150, 150);
  app.stage.addChild(graphics);

  app.ticker.add((time) => {
    graphics.rotation += time.deltaMS / 1000;
  });
})();
