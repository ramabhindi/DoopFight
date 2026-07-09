import { CANVAS, FIGHTERS } from './config.js';
import { loadImage } from './sprites.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// ---------------------------------------------------------------
// Character select screen (Injustice-style):
// two 2x3 grids on the outer quarters of the screen, portraits and
// "selected" text in the middle half. WASD/arrows move the golden
// frame, SHIFT confirms. P1 picks first; vs CPU the computer then
// picks at random.
//
// Draw a golden frame PNG at assets/ui/frame.png and it replaces
// the placeholder gold rectangle automatically.
// ---------------------------------------------------------------

// Grid cells
const CELL_W = 140;
const CELL_H = 200;
const GAP = 9;
const GRID_TOP = 62;
const LEFT_X = 20;
const RIGHT_X = CANVAS.width - 20 - (CELL_W * 2 + GAP);

// Fighter index (0-11) -> cell rectangle on screen.
// 0-5 fill the left grid row by row, 6-11 the right grid.
export function cellRect(index) {
  const grid = Math.floor(index / 6); // 0 = left grid, 1 = right grid
  const local = index % 6;
  const row = Math.floor(local / 2);
  const col = local % 2;
  return {
    x: (grid === 0 ? LEFT_X : RIGHT_X) + col * (CELL_W + GAP),
    y: GRID_TOP + row * (CELL_H + GAP),
    w: CELL_W,
    h: CELL_H,
  };
}

// The two grids act as one 4-wide, 3-tall board for cursor movement:
// columns 0,1 = left grid, columns 2,3 = right grid.
function toBoard(index) {
  const grid = Math.floor(index / 6);
  const local = index % 6;
  return { row: Math.floor(local / 2), col: grid * 2 + (local % 2) };
}
function fromBoard(row, col) {
  const grid = Math.floor(col / 2);
  return grid * 6 + row * 2 + (col % 2);
}

export class CharacterSelect {
  constructor(keyboard, p2Type) {
    this.keyboard = keyboard;
    this.p2Type = p2Type;        // 'human' | 'ai'
    this.phase = 'p1';           // 'p1' -> 'p2' | 'cpu' -> 'done'
    this.cursor = 0;
    this.picks = { p1: null, p2: null };
    this.cpuTimer = 0;
    this.done = false;

    this.frameImg = null;        // your hand-drawn golden frame, once it exists
    loadImage('assets/ui/frame.png').then((img) => { this.frameImg = img; });
  }

  // ---- input -------------------------------------------------------

  update(dt) {
    if (this.phase === 'done') return;

    // CPU "thinks" for a moment on its random pick, then locks in
    if (this.phase === 'cpu') {
      this.cpuTimer -= dt;
      if (this.cpuTimer <= 0) {
        this.picks.p2 = this.cursor;
        this.phase = 'done';
        this.done = true;
      }
      return;
    }

    const kb = this.keyboard;
    let { row, col } = toBoard(this.cursor);
    if (kb.wasPressed('KeyA') || kb.wasPressed('ArrowLeft'))  col = (col + 3) % 4;
    if (kb.wasPressed('KeyD') || kb.wasPressed('ArrowRight')) col = (col + 1) % 4;
    if (kb.wasPressed('KeyW') || kb.wasPressed('ArrowUp'))    row = (row + 2) % 3;
    if (kb.wasPressed('KeyS') || kb.wasPressed('ArrowDown'))  row = (row + 1) % 3;
    this.cursor = fromBoard(row, col);

    if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
      if (this.phase === 'p1') {
        this.picks.p1 = this.cursor;
        if (this.p2Type === 'ai') {
          this.phase = 'cpu';
          this.cursor = Math.floor(Math.random() * FIGHTERS.length);
          this.cpuTimer = 0.9;
        } else {
          this.phase = 'p2';
          this.cursor = 6; // start P2 on the right grid
        }
      } else if (this.phase === 'p2') {
        this.picks.p2 = this.cursor;
        this.phase = 'done';
        this.done = true;
      }
    }
  }

  // ---- drawing -----------------------------------------------------

  draw(ctx) {
    ctx.fillStyle = 'rgba(12, 9, 18, 0.85)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23e';
    ctx.font = `bold 38px ${FONT}`;
    ctx.fillText('CHOOSE YOUR FIGHTER', CANVAS.width / 2, 44);

    for (let i = 0; i < FIGHTERS.length; i++) this.drawCell(ctx, i);

    this.drawCursorFrame(ctx, cellRect(this.cursor));

    // P1 readout: top of the middle area (matches the diagram)
    const p1Hover = this.phase === 'p1' ? this.cursor : this.picks.p1;
    this.drawPlayerText(ctx, 'PLAYER 1', p1Hover, 345, 108, 'left', this.picks.p1 !== null);
    if (p1Hover !== null) this.drawPortrait(ctx, FIGHTERS[p1Hover], 355);

    // P2 readout: bottom of the middle area
    if (this.phase !== 'p1') {
      const label = this.p2Type === 'ai' ? 'CPU' : 'PLAYER 2';
      const p2Hover = this.phase === 'done' ? this.picks.p2 : this.cursor;
      this.drawPlayerText(ctx, label, p2Hover, 935, 622, 'right', this.picks.p2 !== null);
      if (p2Hover !== null) this.drawPortrait(ctx, FIGHTERS[p2Hover], 725);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `18px ${FONT}`;
    ctx.fillText('WASD / Arrow Keys to move  ·  SHIFT to confirm', CANVAS.width / 2, CANVAS.height - 16);
  }

  drawCell(ctx, i) {
    const { x, y, w, h } = cellRect(i);
    const f = FIGHTERS[i];

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, h);

    // Placeholder head icon: the fighter's color with an eye dot.
    // TODO: swap for hand-drawn head icons (e.g. assets/ui/icons/<slug>.png)
    const pad = 14;
    ctx.fillStyle = f.color;
    ctx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2 - 22);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + w * 0.62, y + h * 0.32, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(f.name, x + w / 2, y + h - 10);

    // Badge on locked-in picks
    const badge =
      this.picks.p1 === i ? 'P1' :
      this.picks.p2 === i ? (this.p2Type === 'ai' ? 'CPU' : 'P2') : null;
    if (badge) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(x, y, 44, 24);
      ctx.fillStyle = '#ffd23e';
      ctx.font = `bold 15px ${FONT}`;
      ctx.fillText(badge, x + 22, y + 17);
    }
  }

  drawCursorFrame(ctx, r) {
    if (this.frameImg) {
      ctx.drawImage(this.frameImg, r.x - 8, r.y - 8, r.w + 16, r.h + 16);
      return;
    }
    // Placeholder golden frame until assets/ui/frame.png exists
    ctx.strokeStyle = 'rgba(255, 210, 62, 0.35)';
    ctx.lineWidth = 12;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = 5;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
  }

  drawPlayerText(ctx, label, fighterIndex, x, y, align, locked) {
    ctx.textAlign = align;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(label, x, y);
    if (fighterIndex !== null) {
      ctx.fillStyle = '#fff';
      ctx.font = `bold 40px ${FONT}`;
      ctx.fillText(FIGHTERS[fighterIndex].name, x, y + 42);
    }
    if (locked) {
      ctx.fillStyle = '#3ddc84';
      ctx.font = `bold 20px ${FONT}`;
      ctx.fillText('READY', x, y + 74);
    }
  }

  // Big placeholder portrait in the middle half of the screen.
  // TODO: swap for hand-drawn full-body art (assets/ui/portraits/<slug>.png)
  drawPortrait(ctx, f, x) {
    const y = 180, w = 200, h = 380;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.fillStyle = f.color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + w * 0.66, y + h * 0.16, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}
