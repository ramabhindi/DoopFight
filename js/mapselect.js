import { CANVAS, MAPS } from './config.js';
import { loadImage } from './sprites.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// 2x3 map picker shown after character select. WASD/arrows move the golden
// frame, SHIFT confirms. Thumbnails come from each MAPS entry in config.js;
// a map with no thumbnail yet just shows a placeholder box.
const COLS = 3;
const CELL_W = 360;
const CELL_H = 220;
const GAP_X = 40;
const ROW_SPACING = 290; // cell height + room for the label below it
const TOP_Y = 90;
const TOTAL_W = CELL_W * COLS + GAP_X * (COLS - 1);
const LEFT_X = (CANVAS.width - TOTAL_W) / 2;

function cellRect(i) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return {
    x: LEFT_X + col * (CELL_W + GAP_X),
    y: TOP_Y + row * ROW_SPACING,
    w: CELL_W,
    h: CELL_H,
  };
}

export class MapSelect {
  constructor(keyboard) {
    this.keyboard = keyboard;
    this.cursor = 0;
    this.choice = null; // set to a MAPS id once confirmed

    this.frameImg = null;
    loadImage('assets/ui/frame.png').then((img) => { this.frameImg = img; });

    this.thumbnails = MAPS.map((m) => ({ id: m.id, img: null }));
    this.thumbnails.forEach((t, i) => {
      const src = MAPS[i].thumbnail;
      if (src) loadImage(src).then((img) => { t.img = img; });
    });
  }

  update() {
    const kb = this.keyboard;
    const n = MAPS.length;
    const rows = Math.ceil(n / COLS);
    let row = Math.floor(this.cursor / COLS);
    let col = this.cursor % COLS;
    if (kb.wasPressed('KeyA') || kb.wasPressed('ArrowLeft'))  col = (col + COLS - 1) % COLS;
    if (kb.wasPressed('KeyD') || kb.wasPressed('ArrowRight')) col = (col + 1) % COLS;
    if (kb.wasPressed('KeyW') || kb.wasPressed('ArrowUp'))    row = (row + rows - 1) % rows;
    if (kb.wasPressed('KeyS') || kb.wasPressed('ArrowDown'))  row = (row + 1) % rows;
    this.cursor = row * COLS + col;

    if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
      this.choice = MAPS[this.cursor].id;
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(12, 9, 18, 0.9)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillText('CHOOSE YOUR MAP', CANVAS.width / 2, 50);

    MAPS.forEach((m, i) => this.drawCell(ctx, m, i));
    this.drawCursorFrame(ctx, cellRect(this.cursor));

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `18px ${FONT}`;
    ctx.fillText('WASD / Arrow Keys to move  ·  SHIFT to confirm', CANVAS.width / 2, CANVAS.height - 16);
  }

  drawCell(ctx, m, i) {
    const { x, y, w, h } = cellRect(i);
    const thumb = this.thumbnails[i].img;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, h);

    if (thumb) {
      ctx.drawImage(thumb, x, y, w, h);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.textAlign = 'center';
      ctx.font = `20px ${FONT}`;
      ctx.fillText('Thumbnail', x + w / 2, y + h / 2);
    }

    ctx.fillStyle = '#fff';
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(m.name, x + w / 2, y + h + 34);
  }

  drawCursorFrame(ctx, r) {
    if (this.frameImg) {
      ctx.drawImage(this.frameImg, r.x - 8, r.y - 8, r.w + 16, r.h + 16);
      return;
    }
    ctx.strokeStyle = 'rgba(255, 210, 62, 0.35)';
    ctx.lineWidth = 12;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 5;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
  }
}
