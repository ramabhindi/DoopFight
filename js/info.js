import { CANVAS, FIGHTERS } from './config.js';
import { loadImage } from './sprites.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// ---------------------------------------------------------------
// Fighter Info screen (see docs/diagram): a scrollable 2x3 grid on
// the left, the fighter displayed in the middle, and a stats panel
// (Health / Speed / Damage bars) + description on the right.
// WASD/arrows browse, the grid scrolls to reach all 12, ESC goes back.
// ---------------------------------------------------------------

const CELL_W = 150;
const CELL_H = 196;
const GAP = 8;
const GRID_X = 20;
const GRID_Y = 70;
const VISIBLE_ROWS = 3;
const TOTAL_ROWS = FIGHTERS.length / 2;

const PANEL_X = 910;
const PANEL_Y = 70;
const PANEL_W = 350;
const PANEL_H = 235;
const BAR_X = PANEL_X + 110;
const BAR_MAX_W = 165;

// Auto bar color when the roster entry doesn't specify one.
function statColor(v) {
  if (v >= 85) return '#2ecc40';
  if (v >= 60) return '#c8e04a';
  if (v >= 40) return '#ff9f1c';
  return '#ff4136';
}

export class FighterInfo {
  constructor(keyboard) {
    this.keyboard = keyboard;
    this.cursor = 0;
    this.rowOffset = 0; // first visible grid row (0..TOTAL_ROWS-VISIBLE_ROWS)
    this.time = 0;      // drives BIG BIFF's cycling bar / SPINMAN's flashing number
    this.exit = false;

    this.frameImg = null;
    loadImage('assets/ui/frame.png').then((img) => { this.frameImg = img; });
  }

  update(dt) {
    this.time += dt;
    const kb = this.keyboard;

    let row = Math.floor(this.cursor / 2);
    let col = this.cursor % 2;
    if (kb.wasPressed('KeyA') || kb.wasPressed('ArrowLeft'))  col = (col + 1) % 2;
    if (kb.wasPressed('KeyD') || kb.wasPressed('ArrowRight')) col = (col + 1) % 2;
    if (kb.wasPressed('KeyW') || kb.wasPressed('ArrowUp'))    row = (row + TOTAL_ROWS - 1) % TOTAL_ROWS;
    if (kb.wasPressed('KeyS') || kb.wasPressed('ArrowDown'))  row = (row + 1) % TOTAL_ROWS;
    this.cursor = row * 2 + col;

    // Scroll the grid so the cursor stays visible
    if (row < this.rowOffset) this.rowOffset = row;
    if (row > this.rowOffset + VISIBLE_ROWS - 1) this.rowOffset = row - VISIBLE_ROWS + 1;

    if (kb.wasPressed('Escape')) this.exit = true;
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(12, 9, 18, 0.88)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = `bold 38px ${FONT}`;
    ctx.fillText('FIGHTER INFO', CANVAS.width / 2, 44);

    this.drawGrid(ctx);

    const f = FIGHTERS[this.cursor];

    // Fighter name ("Fighter Selected Text" in the diagram)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 46px ${FONT}`;
    ctx.fillText(f.name, 380, 120);

    // Display fighter placeholder (big colored body with the eye dot)
    // TODO: swap for hand-drawn full-body art
    const dx = 480, dy = 210, dw = 220, dh = 420;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(dx - 8, dy - 8, dw + 16, dh + 16);
    ctx.fillStyle = f.color;
    ctx.fillRect(dx, dy, dw, dh);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dx + dw * 0.66, dy + dh * 0.15, 12, 0, Math.PI * 2);
    ctx.fill();

    this.drawStatsPanel(ctx, f);
    this.drawDescription(ctx, f);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `18px ${FONT}`;
    ctx.fillText('WASD / Arrow Keys to browse  ·  ESC back to menu', CANVAS.width / 2, CANVAS.height - 14);
  }

  drawGrid(ctx) {
    for (let vr = 0; vr < VISIBLE_ROWS; vr++) {
      const row = this.rowOffset + vr;
      for (let col = 0; col < 2; col++) {
        const i = row * 2 + col;
        const f = FIGHTERS[i];
        const x = GRID_X + col * (CELL_W + GAP);
        const y = GRID_Y + vr * (CELL_H + GAP);

        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x, y, CELL_W, CELL_H);
        const pad = 14;
        ctx.fillStyle = f.color;
        ctx.fillRect(x + pad, y + pad, CELL_W - pad * 2, CELL_H - pad * 2 - 22);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + CELL_W * 0.62, y + CELL_H * 0.32, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = `bold 13px ${FONT}`;
        ctx.fillText(f.name, x + CELL_W / 2, y + CELL_H - 10);

        if (i === this.cursor) this.drawCursorFrame(ctx, x, y, CELL_W, CELL_H);
      }
    }

    // Scroll hints
    const midX = GRID_X + CELL_W + GAP / 2;
    ctx.fillStyle = '#ffd23e';
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = 'center';
    if (this.rowOffset > 0) ctx.fillText('▲', midX, GRID_Y - 12);
    if (this.rowOffset < TOTAL_ROWS - VISIBLE_ROWS) ctx.fillText('▼', midX, GRID_Y + VISIBLE_ROWS * (CELL_H + GAP) + 16);
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

  drawStatsPanel(ctx, f) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 24);
    ctx.fill();
    ctx.stroke();

    this.drawStat(ctx, 'Health:', PANEL_Y + 60, this.healthBar(f));
    this.drawStat(ctx, 'Speed:',  PANEL_Y + 125, this.speedBar(f));
    this.drawStat(ctx, 'Damage:', PANEL_Y + 190, this.damageBar(f));
  }

  drawStat(ctx, label, y, { value, color, text }) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(label, PANEL_X + 22, y + 6);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(BAR_X, y - 6, BAR_MAX_W, 12);
    ctx.fillStyle = color;
    ctx.fillRect(BAR_X, y - 6, BAR_MAX_W * Math.min(1, value / 100), 12);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(text, BAR_X, y + 28);
  }

  healthBar(f) {
    return { value: f.health, color: f.healthColor ?? statColor(f.health), text: String(f.health) };
  }

  speedBar(f) {
    return { value: f.speed, color: f.speedColor ?? statColor(f.speed), text: f.speedText ?? String(f.speed) };
  }

  damageBar(f) {
    // SPINMAN: flash through his per-round damage values
    if (f.damageFlash) {
      const v = f.damageFlash[Math.floor(this.time * 1.6) % f.damageFlash.length];
      return { value: v, color: statColor(v), text: `${v} — 1x / 2x / 3x by round!` };
    }
    let color = f.damageColor ?? statColor(f.damage);
    // BIG BIFF: bar animates between green and red
    if (color === 'cycle') {
      const t = (Math.sin(this.time * 3) + 1) / 2;
      const r = Math.round(46 + (255 - 46) * t);
      const g = Math.round(204 - (204 - 65) * t);
      color = `rgb(${r},${g},54)`;
    }
    return { value: f.damage, color, text: f.damageText ?? String(f.damage) };
  }

  drawDescription(ctx, f) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('Fighter Description', PANEL_X + PANEL_W / 2, PANEL_Y + PANEL_H + 42);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `17px ${FONT}`;
    const words = f.desc.split(' ');
    let line = '';
    let y = PANEL_Y + PANEL_H + 74;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > PANEL_W - 10 && line) {
        ctx.fillText(line, PANEL_X + 5, y);
        line = word;
        y += 25;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, PANEL_X + 5, y);
  }
}
