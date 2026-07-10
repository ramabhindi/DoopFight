import { WORLD, PROJECTILE } from './config.js';

// A projectile in flight (DOOPY's fireball). Travels horizontally in the
// direction its owner was facing; the Game handles collision and ducking.
export class Projectile {
  constructor({ x, y, dir, damage, owner, frames, unblockable = false, duckable = true, color }) {
    this.x = x;
    this.y = y;               // vertical center
    this.dir = dir;           // 1 = right, -1 = left
    this.damage = damage;
    this.owner = owner;
    this.frames = frames ?? [];
    this.unblockable = unblockable; // BIG BIFF's Logic ignores blocking
    this.duckable = duckable;       // false = crouching doesn't dodge it
    this.color = color;             // placeholder ball color
    this.time = 0;
    this.active = true;

    const scale = PROJECTILE.scale;
    this.w = (this.frames[0]?.width ?? 64) * scale;
    this.h = (this.frames[0]?.height ?? 32) * scale;
  }

  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, width: this.w, height: this.h };
  }

  update(dt) {
    this.x += this.dir * PROJECTILE.speed * dt;
    this.time += dt;
    if (this.x < -200 || this.x > WORLD.width + 200) this.active = false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir, 1); // frames are drawn facing right
    const frame = this.frames.length
      ? this.frames[Math.floor(this.time * PROJECTILE.fps) % this.frames.length]
      : null;
    if (frame) {
      ctx.drawImage(frame, -this.w / 2, -this.h / 2, this.w, this.h);
    } else {
      // placeholder ball for fighters without projectile art yet
      ctx.fillStyle = this.color ?? '#ff9f1c';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
