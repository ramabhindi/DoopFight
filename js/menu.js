import { CANVAS } from './config.js';
import { loadImage } from './sprites.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// Animated title background: MenuBG0000-MenuBG0056 is a one-time intro
// (plays on the first frame the menu appears), then MenuBG0057-MenuBG0116
// loops for as long as the menu is up. Both run at 10fps.
const BG_FPS = 10;
const BG_INTRO_END = 56;  // last intro frame index (inclusive)
const BG_LOOP_END = 116;  // last loop frame index (inclusive)

async function loadMenuBgFrames() {
  const frames = [];
  for (let i = 0; i <= BG_LOOP_END; i++) {
    const img = await loadImage(`assets/ui/MenuBG${String(i).padStart(4, '0')}.png`);
    if (!img) break;
    frames.push(img);
  }
  return frames;
}

// Each button is a 5-frame sprite: frame 0 is unselected, frames 1-4 light
// it up when the golden-frame cursor lands on it (WASD/arrows, not mouse),
// and it plays back to 0 when the cursor moves off. Listed top-to-bottom
// as they're drawn; fadeStartFrame is which MenuBG intro frame (10fps)
// triggers that button's 1s fade-in, staggered bottom (credits) to top (play).
const BUTTONS = [
  { id: 'play',          prefix: 'PlayButton',         fadeStartFrame: 21 },
  { id: 'roster',        prefix: 'RosterButton',       fadeStartFrame: 14 },
  { id: 'instructions',  prefix: 'InstructionsButton', fadeStartFrame: 8 },
  { id: 'credits',       prefix: 'CreditsButton',      fadeStartFrame: 0 },
];

const BTN_X = 40;
const FIRST_Y = 280;
const SPACING = 104;
const HOVER_FRAMES = 4;   // frames 1-4 on top of the base frame 0
const HOVER_RATE = 10;    // frames per second, matches the game's 10fps convention
const FADE_DURATION = 1;  // seconds for a button to reach full opacity

async function loadButtonFrames(prefix) {
  const frames = [];
  for (let i = 0; i <= HOVER_FRAMES; i++) {
    const img = await loadImage(`assets/ui/${prefix}${String(i).padStart(4, '0')}.png`);
    if (!img) break;
    frames.push(img);
  }
  return frames;
}

// Title screen menu, navigated with the same golden frame as character
// select: W/S or up/down to move, SHIFT to confirm.
export class MainMenu {
  constructor(keyboard) {
    this.keyboard = keyboard;
    this.cursor = 0;
    this.choice = null; // set to an option id once the player confirms

    this.bgFrames = [];
    this.bgTime = 0;
    loadMenuBgFrames().then((frames) => { this.bgFrames = frames; });

    // Per-button loaded frames + hover progress (0..HOVER_FRAMES).
    this.buttons = BUTTONS.map((b) => ({ ...b, frames: [], hoverT: 0 }));
    this.buttons.forEach((b) => {
      loadButtonFrames(b.prefix).then((frames) => { b.frames = frames; });
    });
  }

  update(dt) {
    this.bgTime += dt;

    const kb = this.keyboard;
    const n = this.buttons.length;
    if (kb.wasPressed('KeyW') || kb.wasPressed('ArrowUp'))   this.cursor = (this.cursor + n - 1) % n;
    if (kb.wasPressed('KeyS') || kb.wasPressed('ArrowDown')) this.cursor = (this.cursor + 1) % n;
    if (kb.wasPressed('ShiftLeft') || kb.wasPressed('ShiftRight')) {
      this.choice = this.buttons[this.cursor].id;
    }

    this.buttons.forEach((b, i) => {
      const dir = i === this.cursor ? 1 : -1;
      b.hoverT = Math.min(HOVER_FRAMES, Math.max(0, b.hoverT + dir * HOVER_RATE * dt));
    });
  }

  // Current MenuBG frame image, or null until the frames have loaded.
  get bgFrame() {
    const frames = this.bgFrames;
    if (frames.length === 0) return null;
    const elapsed = Math.floor(this.bgTime * BG_FPS);

    if (elapsed <= BG_INTRO_END) return frames[elapsed] ?? frames[0];

    const loopLen = BG_LOOP_END - BG_INTRO_END; // number of loop frames after the intro
    const loopIndex = BG_INTRO_END + 1 + ((elapsed - BG_INTRO_END - 1) % loopLen);
    return frames[loopIndex] ?? frames[frames.length - 1];
  }

  draw(ctx) {
    if (this.bgFrame) {
      ctx.drawImage(this.bgFrame, 0, 0, CANVAS.width, CANVAS.height);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    }

    this.buttons.forEach((b, i) => this.drawButton(ctx, b, i));
  }

  drawButton(ctx, b, i) {
    const y = FIRST_Y + i * SPACING;
    const fadeStart = b.fadeStartFrame / BG_FPS;
    const opacity = Math.min(1, Math.max(0, (this.bgTime - fadeStart) / FADE_DURATION));
    if (opacity <= 0) return;

    const frame = b.frames[Math.round(b.hoverT)] ?? b.frames[0];

    ctx.save();
    ctx.globalAlpha = opacity;
    if (frame) {
      ctx.drawImage(frame, BTN_X, y);
    } else {
      // Placeholder until art loads: plain box + label
      ctx.fillStyle = i === this.cursor ? 'rgba(255,210,62,0.12)' : 'rgba(255,255,255,0.07)';
      ctx.fillRect(BTN_X, y, 391, 100);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(b.id.toUpperCase(), BTN_X + 195, y + 56);
    }
    ctx.restore();
  }
}
