import { ANIMATION_NAMES, ANIMATION_DEFAULTS, ANIMATION_OVERRIDES } from './config.js';

// Resolves to the loaded Image, or null if the file doesn't exist.
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Auto-discover frames: <dir>/<name>_0.png, <name>_1.png, ... until missing.
// (Missing-file 404s in the console while developing are normal and harmless.)
async function loadAnimation(dir, name) {
  const frames = [];
  for (let i = 0; ; i++) {
    const img = await loadImage(`${dir}/${name}_${i}.png`);
    if (!img) break;
    frames.push(img);
  }
  if (frames.length === 0) return null; // not drawn yet — Fighter shows a placeholder
  return { frames, ...ANIMATION_DEFAULTS, ...(ANIMATION_OVERRIDES[name] ?? {}) };
}

// Load frames named <dir>/<prefix>001.png, <prefix>002.png, ... until missing.
// Used for projectile sheets like doopy's FB001-FB005 fireball.
export async function loadPrefixedFrames(dir, prefix) {
  const frames = [];
  for (let i = 1; ; i++) {
    const img = await loadImage(`${dir}/${prefix}${String(i).padStart(3, '0')}.png`);
    if (!img) break;
    frames.push(img);
  }
  return frames;
}

// Loads every animation for one fighter folder, e.g. 'doopy'.
export async function loadFighterAnimations(folderName) {
  const dir = `assets/sprites/${folderName}`;
  const animations = {};
  await Promise.all(
    ANIMATION_NAMES.map(async (name) => {
      animations[name] = await loadAnimation(dir, name);
    })
  );
  return animations;
}

// Plays one animation at a time and hands back the current frame image.
export class Animator {
  constructor(animations) {
    this.animations = animations;
    this.currentName = null;
    this.current = null;
    this.time = 0;
  }

  play(name) {
    if (this.currentName === name) return;
    this.currentName = name;
    this.current = this.animations[name] ?? null;
    this.time = 0;
  }

  update(dt) { this.time += dt; }

  // Current frame Image, or null if this animation hasn't been drawn yet.
  get frame() {
    const anim = this.current;
    if (!anim) return null;
    let i = Math.floor(this.time * anim.fps);
    i = anim.loop ? i % anim.frames.length : Math.min(i, anim.frames.length - 1);
    return anim.frames[i];
  }
}
