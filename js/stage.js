import { CANVAS, WORLD, STAGE } from './config.js';
import { loadImage } from './sprites.js';

// ---------------------------------------------------------------
// The stage is three layers, chosen per-map (see config.js MAPS):
//
//   background — far scenery. Drawn first.
//   ground     — the walking ground, exactly WORLD.width wide.
//                Scrolls 1:1 with the fighters. Drawn behind them.
//   foreground — near props. Drawn IN FRONT of the fighters.
//                Needs lots of transparency.
//
// A layer is either a single static PNG or an auto-discovered numbered
// sequence (assets/stages/<prefix>0000.png, 0001.png, ...) that loops
// at its own fps. Parallax speed is automatic, based on image width:
//   wider image  = scrolls faster (feels closer)
//   1280px wide  = doesn't scroll at all (pinned to the screen)
// All layers are bottom-aligned and 720px tall is the safe default.
// Any layer that's missing (or a map that just doesn't have one yet)
// isn't drawn — placeholders fill in, same as any other missing art.
// ---------------------------------------------------------------

async function loadNumberedFrames(dir, prefix) {
  const frames = [];
  for (let i = 0; ; i++) {
    const img = await loadImage(`${dir}/${prefix}${String(i).padStart(4, '0')}.png`);
    if (!img) break;
    frames.push(img);
  }
  return frames;
}

async function loadLayer(def) {
  if (!def) return null;
  if (def.type === 'static') {
    const img = await loadImage(def.src);
    return img ? { kind: 'static', img } : null;
  }
  const frames = await loadNumberedFrames('assets/stages', def.prefix);
  return frames.length ? { kind: 'animated', frames, fps: def.fps ?? 10 } : null;
}

export class Stage {
  constructor() {
    this.background = null;
    this.ground = null;
    this.foreground = null;
    this.groundYOffset = 0;
    this.animTime = 0;
  }

  // Swap in a new map's layers. Call once when a fight starts.
  async loadMap(mapDef) {
    const [background, ground, foreground] = await Promise.all([
      loadLayer(mapDef.background),
      loadLayer(mapDef.ground),
      loadLayer(mapDef.foreground),
    ]);
    this.background = background;
    this.ground = ground;
    this.foreground = foreground;
    this.groundYOffset = mapDef.ground?.yOffset ?? 0;
    this.animTime = 0;
  }

  update(dt) {
    this.animTime += dt;
  }

  // The layer's current Image: the static PNG, or whichever animation
  // frame is due right now (loops continuously at the layer's own fps).
  currentImage(layer) {
    if (!layer) return null;
    if (layer.kind === 'static') return layer.img;
    const i = Math.floor(this.animTime * layer.fps) % layer.frames.length;
    return layer.frames[i];
  }

  // How far a layer scrolls for the current camera position.
  // A layer exactly as wide as the screen never moves; a layer as wide
  // as the world moves 1:1; anything between parallaxes proportionally.
  layerX(img, camX) {
    const cameraRange = WORLD.width - CANVAS.width;
    const layerRange = img.width - CANVAS.width;
    if (cameraRange <= 0 || layerRange <= 0) return 0;
    return -camX * (layerRange / cameraRange);
  }

  drawLayer(ctx, img, camX, yOffset = 0) {
    ctx.drawImage(img, this.layerX(img, camX), CANVAS.height - img.height + yOffset);
  }

  // Everything BEHIND the fighters.
  drawBackground(ctx, camX) {
    const bg = this.currentImage(this.background);
    if (bg) this.drawLayer(ctx, bg, camX);
    else this.drawPlaceholderSky(ctx, camX);

    const gr = this.currentImage(this.ground);
    if (gr) this.drawLayer(ctx, gr, camX, this.groundYOffset);
    else this.drawPlaceholderGround(ctx, camX);
  }

  // Everything IN FRONT of the fighters.
  drawForeground(ctx, camX) {
    const fg = this.currentImage(this.foreground);
    if (fg) this.drawLayer(ctx, fg, camX);
  }

  // ---- placeholders until the hand-drawn layers exist ------------

  drawPlaceholderSky(ctx, camX) {
    const sky = ctx.createLinearGradient(0, 0, 0, STAGE.floorY);
    sky.addColorStop(0, '#2b2440');
    sky.addColorStop(1, '#5d4a6e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

    // Distant hills at ~1/3 scroll speed so the parallax is visible
    ctx.fillStyle = '#453a5c';
    for (let i = 0; i < 7; i++) {
      const worldX = i * 380;
      const x = worldX - camX * 0.33;
      ctx.beginPath();
      ctx.arc(x, STAGE.floorY, 190, Math.PI, 0);
      ctx.fill();
    }
  }

  drawPlaceholderGround(ctx, camX) {
    ctx.fillStyle = '#3a3145';
    ctx.fillRect(0, STAGE.floorY, CANVAS.width, CANVAS.height - STAGE.floorY);
    ctx.strokeStyle = '#7a688c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, STAGE.floorY);
    ctx.lineTo(CANVAS.width, STAGE.floorY);
    ctx.stroke();

    // Tick marks every 200 world-px so ground movement reads clearly
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    for (let worldX = 0; worldX <= WORLD.width; worldX += 200) {
      const x = worldX - camX;
      ctx.beginPath();
      ctx.moveTo(x, STAGE.floorY + 8);
      ctx.lineTo(x, STAGE.floorY + 28);
      ctx.stroke();
    }
  }
}
