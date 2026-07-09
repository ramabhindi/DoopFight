import { CANVAS } from './config.js';
import { loadImage } from './sprites.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

const OPTIONS = [
  { id: 'single', label: 'SINGLE PLAYER' },
  { id: 'multi',  label: 'MULTIPLAYER' },
  { id: 'info',   label: 'FIGHTER INFO' },
];

const BOX_W = 460;
const BOX_H = 66;
const BOX_X = (CANVAS.width - BOX_W) / 2;
const FIRST_Y = 300;
const SPACING = 92;

// Title screen menu, navigated with the same golden frame as character
// select: W/S or up/down to move, SHIFT to confirm.
export class MainMenu {
  constructor(keyboard) {
    this.keyboard = keyboard;
    this.cursor = 0;
    this.choice = null; // set to an option id once the player confirms

    this.frameImg = null;
    loadImage('assets/ui/frame.png').then((img) => { this.frameImg = img; });
  }

  update() {
    const kb = this.keyboard;
    const n = OPTIONS.length;
    if (kb.wasPressed('KeyW') || kb.wasPressed('ArrowUp'))   this.cursor = (this.cursor + n - 1) % n;
    if (kb.wasPressed('KeyS') || kb.wasPressed('ArrowDown')) this.cursor = (this.cursor + 1) % n;
    if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
      this.choice = OPTIONS[this.cursor].id;
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = `bold 110px ${FONT}`;
    ctx.fillText('DOOP FIGHT', CANVAS.width / 2, 200);

    OPTIONS.forEach((opt, i) => {
      const y = FIRST_Y + i * SPACING;
      ctx.fillStyle = i === this.cursor ? 'rgba(255,210,62,0.12)' : 'rgba(255,255,255,0.07)';
      ctx.fillRect(BOX_X, y, BOX_W, BOX_H);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 30px ${FONT}`;
      ctx.fillText(opt.label, CANVAS.width / 2, y + 44);
    });

    this.drawCursorFrame(ctx, BOX_X, FIRST_Y + this.cursor * SPACING, BOX_W, BOX_H);

    // Controls reference
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `20px ${FONT}`;
    ctx.fillText('P1:  A/D move · W jump · S crouch · F punch · G kick · H special · L-Shift block', CANVAS.width / 2, 618);
    ctx.fillText('P2:  ←/→ move · ↑ jump · ↓ crouch · , punch · . kick · / special · R-Shift block', CANVAS.width / 2, 650);
    ctx.fillText('Shift + crouch = low block', CANVAS.width / 2, 682);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `18px ${FONT}`;
    ctx.fillText('W/S or ↑/↓ to navigate  ·  SHIFT to confirm', CANVAS.width / 2, CANVAS.height - 12);
  }

  drawCursorFrame(ctx, x, y, w, h) {
    if (this.frameImg) {
      ctx.drawImage(this.frameImg, x - 8, y - 8, w + 16, h + 16);
      return;
    }
    ctx.strokeStyle = 'rgba(255, 210, 62, 0.35)';
    ctx.lineWidth = 12;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 5;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  }
}
