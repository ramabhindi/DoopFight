import { Keyboard } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keyboard = new Keyboard();

(() => {
  // Fighter sprites are loaded after character select, per chosen fighter.
  const game = new Game(ctx, keyboard);

  let last = performance.now();
  function frame(now) {
    // Clamp dt so a background tab doesn't cause one giant physics step
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;

    game.update(dt);
    game.draw();
    keyboard.endFrame();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
