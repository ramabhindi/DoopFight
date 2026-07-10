import { CANVAS } from './config.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// 3-column game mode picker shown after PLAY. A/D or left/right arrows move,
// SHIFT confirms, ESC backs out to the title screen.
// STORY and CPU both start a vs-AI match for now (Story has no content yet);
// VERSUS starts a local 1v1 (human vs human).
const COLUMNS = [
  { id: 'story',  label: 'STORY' },
  { id: 'versus', label: 'VERSUS' },
  { id: 'cpu',    label: 'CPU' },
];

const COL_W = 360;
const COL_H = 480;
const GAP = 20;
const TOP_Y = 120;
const TOTAL_W = COL_W * COLUMNS.length + GAP * (COLUMNS.length - 1);
const LEFT_X = (CANVAS.width - TOTAL_W) / 2;

export class ModeSelect {
  constructor(keyboard) {
    this.keyboard = keyboard;
    this.cursor = 1; // start on VERSUS, the middle column
    this.choice = null;
    this.exit = false;
  }

  update() {
    const kb = this.keyboard;
    const n = COLUMNS.length;
    if (kb.wasPressed('KeyA') || kb.wasPressed('ArrowLeft'))  this.cursor = (this.cursor + n - 1) % n;
    if (kb.wasPressed('KeyD') || kb.wasPressed('ArrowRight')) this.cursor = (this.cursor + 1) % n;
    if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
      this.choice = COLUMNS[this.cursor].id;
    }
    if (kb.wasPressed('Escape')) this.exit = true;
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(12, 9, 18, 0.9)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = `bold 44px ${FONT}`;
    ctx.fillText('CHOOSE YOUR MODE', CANVAS.width / 2, 70);

    COLUMNS.forEach((col, i) => {
      const x = LEFT_X + i * (COL_W + GAP);
      const selected = i === this.cursor;

      ctx.fillStyle = selected ? 'rgba(255,210,62,0.12)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(x, TOP_Y, COL_W, COL_H);

      if (selected) {
        ctx.strokeStyle = '#ffd23e';
        ctx.lineWidth = 5;
        ctx.strokeRect(x + 2, TOP_Y + 2, COL_W - 4, COL_H - 4);
      }

      ctx.fillStyle = '#fff';
      ctx.font = `bold 36px ${FONT}`;
      ctx.fillText(col.label, x + COL_W / 2, TOP_Y + COL_H / 2);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `18px ${FONT}`;
    ctx.fillText('A/D or ←/→ to move  ·  SHIFT to confirm  ·  ESC to go back', CANVAS.width / 2, CANVAS.height - 16);
  }
}
