import { CANVAS, WORLD, STAGE } from './config.js';
import { loadImage } from './sprites.js';

// ---------------------------------------------------------------
// The stage is three hand-drawn PNG layers in assets/stages/:
//
//   background.png — far scenery (sky, buildings). Drawn first.
//   ground.png     — the walking ground, exactly WORLD.width wide.
//                    Scrolls 1:1 with the fighters. Drawn behind them.
//   foreground.png — near props (bushes, railings). Drawn IN FRONT
//                    of the fighters. Needs lots of transparency.
//
// Parallax speed is automatic, based on image width:
//   wider image  = scrolls faster (feels closer)
//   1280px wide  = doesn't scroll at all (pinned to the screen)
// So: background ~1600px, ground exactly 2200px, foreground ~2600px.
// All layers are bottom-aligned and 720px tall is the safe default.
// Any layer that's missing just isn't drawn (placeholders fill in).
// ---------------------------------------------------------------

export class Stage {
  constructor() {
    this.background = null;
    this.ground = null;
    this.foreground = null;
    loadImage('assets/stages/background.png').then((img) => { this.background = img; });
    loadImage('assets/stages/ground.png').then((img) => { this.ground = img; });
    loadImage('assets/stages/foreground.png').then((img) => { this.foreground = img; });
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

  drawLayer(ctx, img, camX) {
    ctx.drawImage(img, this.layerX(img, camX), CANVAS.height - img.height);
  }

  // Everything BEHIND the fighters.
  drawBackground(ctx, camX) {
    if (this.background) this.drawLayer(ctx, this.background, camX);
    else this.drawPlaceholderSky(ctx, camX);

    if (this.ground) this.drawLayer(ctx, this.ground, camX);
    else this.drawPlaceholderGround(ctx, camX);
  }

  // Everything IN FRONT of the fighters.
  drawForeground(ctx, camX) {
    if (this.foreground) this.drawLayer(ctx, this.foreground, camX);
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
