import { CANVAS, FIGHTERS } from './config.js';
import { loadImage } from './sprites.js';
import { SUPERS, getEquipped, setEquipped } from './supers.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// ---------------------------------------------------------------
// Fighter Info screen (see docs/diagram): a scrollable 2x3 grid on
// the left, the fighter displayed in the middle, and a stats panel
// (Health / Speed / Damage bars) + description on the right, with
// the fighter's two SUPER ATTACKS below. SHIFT on a fighter jumps
// the golden frame to the super squares to change which is equipped
// (the equipped one glows; the other is grayed out).
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

// Super squares (right column, under the description)
const SQ_SIZE = 62;
const SQ_Y = 496;
const SQ_X = [PANEL_X + PANEL_W / 2 - SQ_SIZE - 12, PANEL_X + PANEL_W / 2 + 12];

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
    this.rowOffset = 0;  // first visible grid row (0..TOTAL_ROWS-VISIBLE_ROWS)
    this.mode = 'grid';  // 'grid' | 'supers' (golden frame on the super squares)
    this.superCursor = 0;
    this.time = 0;       // drives BIG BIFF's cycling bar / SPINMAN's flashing number
    this.exit = false;

    this.frameImg = null;
    loadImage('assets/ui/frame.png').then((img) => { this.frameImg = img; });

    // Optional hand-drawn super icons: assets/ui/supers/<id>.png
    this.icons = {};
    for (const supers of Object.values(SUPERS)) {
      for (const s of supers) {
        loadImage(`assets/ui/supers/${s.id}.png`).then((img) => { this.icons[s.id] = img; });
      }
    }
  }

  update(dt) {
    this.time += dt;
    const kb = this.keyboard;
    const slug = FIGHTERS[this.cursor].slug;

    if (this.mode === 'supers') {
      if (kb.wasPressed('KeyA') || kb.wasPressed('ArrowLeft') ||
          kb.wasPressed('KeyD') || kb.wasPressed('ArrowRight')) {
        this.superCursor = 1 - this.superCursor;
      }
      if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
        setEquipped(slug, this.superCursor); // equip and hop back to the grid
        this.mode = 'grid';
      }
      if (kb.wasPressed('Escape')) this.mode = 'grid';
      return;
    }

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

    // SHIFT: move the golden frame onto this fighter's super squares
    if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
      this.mode = 'supers';
      this.superCursor = getEquipped(slug);
    }

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
    const dx = 480, dy = 190, dw = 220, dh = 350;
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
    this.drawSupers(ctx, f);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `18px ${FONT}`;
    const hint = this.mode === 'supers'
      ? 'A/D choose super  ·  SHIFT equip  ·  ESC back to fighters'
      : 'WASD / Arrows browse  ·  SHIFT change super  ·  ESC back to menu';
    ctx.fillText(hint, CANVAS.width / 2, CANVAS.height - 14);
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

        if (this.mode === 'grid' && i === this.cursor) {
          this.drawCursorFrame(ctx, x, y, CELL_W, CELL_H);
        }
        if (this.mode === 'supers' && i === this.cursor) {
          // faint marker so you remember whose supers you're editing
          ctx.strokeStyle = 'rgba(255, 210, 62, 0.5)';
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 2, y - 2, CELL_W + 4, CELL_H + 4);
        }
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

  // ---- super attacks section ----------------------------------------

  drawSupers(ctx, f) {
    const supers = SUPERS[f.slug];
    if (!supers) return;
    const equippedIdx = getEquipped(f.slug);
    // Hovering shows that super; otherwise the section shows the equipped one
    const shownIdx = this.mode === 'supers' ? this.superCursor : equippedIdx;

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('Super Attacks', PANEL_X + PANEL_W / 2, SQ_Y - 14);

    for (let i = 0; i < 2; i++) {
      const x = SQ_X[i];
      const s = supers[i];

      // icon (hand-drawn if present, else colored square with initials)
      const icon = this.icons[s.id];
      if (icon) {
        ctx.drawImage(icon, x, SQ_Y, SQ_SIZE, SQ_SIZE);
      } else {
        ctx.fillStyle = f.color;
        ctx.fillRect(x, SQ_Y, SQ_SIZE, SQ_SIZE);
        ctx.fillStyle = '#111';
        ctx.font = `bold 22px ${FONT}`;
        ctx.fillText(s.name.split(' ').map((w) => w[0]).join('').slice(0, 3),
          x + SQ_SIZE / 2, SQ_Y + SQ_SIZE / 2 + 8);
      }

      if (i === equippedIdx) {
        // equipped: glowing golden frame
        const pulse = 0.55 + 0.45 * Math.sin(this.time * 5);
        ctx.save();
        ctx.shadowColor = '#ffd23e';
        ctx.shadowBlur = 14 + 8 * pulse;
        ctx.strokeStyle = '#ffd23e';
        ctx.lineWidth = 4;
        ctx.strokeRect(x - 3, SQ_Y - 3, SQ_SIZE + 6, SQ_SIZE + 6);
        ctx.restore();
      } else {
        // unequipped: grayed out
        ctx.fillStyle = 'rgba(20, 16, 28, 0.62)';
        ctx.fillRect(x, SQ_Y, SQ_SIZE, SQ_SIZE);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, SQ_Y, SQ_SIZE, SQ_SIZE);
      }

      // golden navigation frame while choosing
      if (this.mode === 'supers' && i === this.superCursor) {
        this.drawCursorFrame(ctx, x - 4, SQ_Y - 4, SQ_SIZE + 8, SQ_SIZE + 8);
      }
    }

    // Name (underlined), description, and charge cost of the shown super
    const s = supers[shownIdx];
    const nameX = 640, nameY = 596;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillText(s.name, nameX, nameY);
    const nw = ctx.measureText(s.name).width;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nameX - nw / 2 - 6, nameY + 6);
    ctx.lineTo(nameX + nw / 2 + 6, nameY + 6);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `16px ${FONT}`;
    const text = `${s.desc} Needs ${s.charges} charges.`;
    this.wrapText(ctx, text, 385, nameY + 28, 510, 21);
  }

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  // ---- stats + description -------------------------------------------

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
    ctx.font = `15px ${FONT}`;
    this.wrapText(ctx, f.desc, PANEL_X + 5, PANEL_Y + PANEL_H + 70, PANEL_W - 10, 20);
  }
}
