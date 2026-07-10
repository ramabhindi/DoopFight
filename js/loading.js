import { CANVAS } from './config.js';
import { loadImage } from './sprites.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// Shown once, on first launch: holds on assets/ui/LoadingScreen.png until the
// title screen's own assets (background frames, button frames, music) are
// ready AND a minimum amount of time has passed, then waits for a keypress.
// This exists so the animated intro and the music always start in lockstep -
// without it, whichever asset happens to load slower drifts the sync.
const MIN_DISPLAY_TIME = 3.5; // seconds

export class LoadingScreen {
  constructor() {
    this.time = 0;
    this.done = false;

    this.bgImg = null;
    loadImage('assets/ui/LoadingScreen.png').then((img) => { this.bgImg = img; });
  }

  update(dt, keyboard, assetsReady) {
    this.time += dt;
    const ready = assetsReady && this.time >= MIN_DISPLAY_TIME;
    if (ready && keyboard.anyPressed()) this.done = true;
  }

  draw(ctx, assetsReady) {
    if (this.bgImg) {
      ctx.drawImage(this.bgImg, 0, 0, CANVAS.width, CANVAS.height);
    } else {
      ctx.fillStyle = '#0c0912';
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    }

    const ready = assetsReady && this.time >= MIN_DISPLAY_TIME;
    if (ready) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff';
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText('PRESS ANY KEY TO CONTINUE', 30, CANVAS.height - 30);
    }
  }
}
