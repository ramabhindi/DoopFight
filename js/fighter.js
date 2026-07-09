import {
  WORLD, STAGE, PHYSICS, MATCH, ATTACKS, BASE_STAT,
  HURT_TIME, BLOCK_CHIP, BLOCK_PUSHBACK, FIGHTER_SIZE, SPRITE_SCALE,
} from './config.js';
import { Animator } from './sprites.js';

// States a fighter can be in. Each maps 1:1 to an animation name.
// idle, walk, jump, crouch, block, blockLow, punch, kick, special, hurt, ko

export class Fighter {
  constructor({ name, x, facing, animations, color, def }) {
    this.name = name;
    this.color = color;        // placeholder color until sprites are drawn
    this.def = def ?? {};      // roster entry from config FIGHTERS (stats, gimmicks)

    // Stats from the roster (baseline: 70 speed/damage = 1x, 100 health)
    this.maxHealth = this.def.health ?? MATCH.maxHealth;
    this.walkSpeed = PHYSICS.walkSpeed * (this.def.speed ?? BASE_STAT) / BASE_STAT;
    this.maxJumps = this.def.jumps ?? 1;

    // x = horizontal center, y = feet position
    this.x = x;
    this.y = STAGE.floorY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;      // 1 = facing right, -1 = facing left

    this.health = this.maxHealth;
    this.state = 'idle';
    this.stateTime = 0;
    this.jumpsUsed = 0;
    this.roundNumber = 1;      // set by Game each round (SPINMAN's multiplier)

    this.attack = null;        // active attack data while punching/kicking
    this.attackHasHit = false; // an attack can only connect once
    this.projectileFrames = []; // fireball animation, loaded by Game if this fighter has one

    this.animator = new Animator(animations);
    this.animator.play('idle');
  }

  resetForRound(x, facing) {
    this.x = x;
    this.y = STAGE.floorY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = this.maxHealth;
    this.jumpsUsed = 0;
    this.attack = null;
    this.attackHasHit = false;
    this.setState('idle');
  }

  setState(name) {
    this.state = name;
    this.stateTime = 0;
    this.animator.play(name);
  }

  get grounded() { return this.y >= STAGE.floorY; }
  get crouching() { return this.state === 'crouch' || this.state === 'blockLow'; }
  get isKO() { return this.state === 'ko'; }

  canAct() {
    return !['hurt', 'ko', 'punch', 'kick', 'special', 'jump'].includes(this.state);
  }

  // ---- main update -------------------------------------------------

  update(dt, cmd, opponent) {
    this.stateTime += dt;
    this.animator.update(dt);

    // Always turn toward the opponent when free to act on the ground
    if (this.grounded && this.canAct()) {
      this.facing = opponent.x >= this.x ? 1 : -1;
    }

    switch (this.state) {
      case 'ko':
        this.vx = 0;
        break;

      case 'hurt':
        // Knockback velocity decays over the stun
        this.vx *= Math.max(0, 1 - dt * 6);
        if (this.stateTime >= HURT_TIME) this.setState('idle');
        break;

      case 'punch':
      case 'kick':
      case 'special': {
        this.vx = 0;
        const a = this.attack;
        if (this.stateTime >= a.startup + a.active + a.recovery) {
          this.attack = null;
          this.setState('idle');
        }
        break;
      }

      case 'jump':
        // Mid-air jumps for fighters with more than one (RIO's triple jump)
        if (cmd.jump && this.jumpsUsed < this.maxJumps) {
          this.jumpsUsed += 1;
          this.vy = PHYSICS.jumpVelocity;
          const dir = (cmd.right ? 1 : 0) - (cmd.left ? 1 : 0);
          if (dir !== 0) this.vx = dir * this.walkSpeed;
        }
        // TODO: air attacks could hook in here.
        break;

      default:
        this.handleGroundControls(cmd);
    }

    this.applyPhysics(dt);
  }

  handleGroundControls(cmd) {
    this.vx = 0;

    // Block wins over everything (Shift held; + crouch = low block)
    if (cmd.block) {
      this.setStateIfChanged(cmd.crouch ? 'blockLow' : 'block');
      return;
    }
    if (cmd.punch) return this.startAttack('punch');
    if (cmd.kick) return this.startAttack('kick');
    if (cmd.special) return this.startAttack('special');

    if (cmd.jump && this.maxJumps > 0) { // GUYBO (0 jumps) stays grounded
      this.jumpsUsed = 1;
      this.vy = PHYSICS.jumpVelocity;
      const dir = (cmd.right ? 1 : 0) - (cmd.left ? 1 : 0);
      this.vx = dir * this.walkSpeed;
      this.setState('jump');
      return;
    }
    if (cmd.crouch) {
      this.setStateIfChanged('crouch');
      return;
    }

    const dir = (cmd.right ? 1 : 0) - (cmd.left ? 1 : 0);
    if (dir !== 0) {
      this.vx = dir * this.walkSpeed;
      this.setStateIfChanged('walk');
    } else {
      this.setStateIfChanged('idle');
    }
  }

  // Like setState but doesn't restart the animation every frame while held.
  setStateIfChanged(name) {
    if (this.state !== name) this.setState(name);
  }

  applyPhysics(dt) {
    this.vy += PHYSICS.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Land on the floor
    if (this.y >= STAGE.floorY) {
      this.y = STAGE.floorY;
      this.vy = 0;
      this.jumpsUsed = 0;
      if (this.state === 'jump') this.setState('idle');
    }

    // Keep inside the world's walls (the camera scrolls; the screen edge isn't the wall)
    const half = FIGHTER_SIZE.width / 2;
    const minX = STAGE.wallPadding + half;
    const maxX = WORLD.width - STAGE.wallPadding - half;
    this.x = Math.min(maxX, Math.max(minX, this.x));
  }

  // ---- combat ------------------------------------------------------

  startAttack(name) {
    const base = ATTACKS[name];
    const damage = Math.max(1, Math.round(base.damage * this.rollDamageStat() / BASE_STAT));
    this.attack = { name, ...base, damage };
    if (name === 'special' && this.def.special === 'fireball') {
      this.attack.projectile = true; // no melee hitbox — Game spawns the fireball
      this.attack.spawned = false;
    }
    this.attackHasHit = false;
    this.setState(name);
  }

  // This fighter's damage stat for one hit (some fighters roll it per hit).
  rollDamageStat() {
    const d = this.def.damage ?? BASE_STAT;
    if (this.def.damageMode === 'random') return Math.random() * 100;    // BIG BIFF
    if (this.def.damageMode === 'perRound') return d * this.roundNumber; // SPINMAN
    return d;
  }

  // True while the attack's hitbox is out and it hasn't landed yet.
  // Projectile specials have no melee hitbox — the fireball does the hitting.
  isAttackActive() {
    const a = this.attack;
    return !!a && !a.projectile && !this.attackHasHit &&
      this.stateTime >= a.startup &&
      this.stateTime < a.startup + a.active;
  }

  // Rectangle the current attack can hit, in world space.
  hitbox() {
    const a = this.attack;
    if (!a) return null;
    const h = FIGHTER_SIZE.height;
    // Vertical band depends on attack height
    const bands = {
      high: [this.y - h,        this.y - h * 0.55],
      mid:  [this.y - h * 0.70, this.y - h * 0.30],
      low:  [this.y - h * 0.35, this.y],
    };
    const [top, bottom] = bands[a.height];
    const reach = this.facing * a.range;
    return {
      x: Math.min(this.x, this.x + reach),
      y: top,
      width: a.range,
      height: bottom - top,
    };
  }

  // Rectangle where this fighter can be hit.
  hurtbox() {
    const h = this.crouching ? FIGHTER_SIZE.crouchHeight : FIGHTER_SIZE.height;
    return {
      x: this.x - FIGHTER_SIZE.width / 2,
      y: this.y - h,
      width: FIGHTER_SIZE.width,
      height: h,
    };
  }

  // Called by Game when an enemy attack connects. Returns true if it was blocked.
  takeHit(attack, attackerFacing) {
    const blocked =
      (this.state === 'block'    && (attack.height === 'high' || attack.height === 'mid')) ||
      (this.state === 'blockLow' && (attack.height === 'low'  || attack.height === 'mid'));

    if (blocked) {
      this.health = Math.max(0, this.health - BLOCK_CHIP);
      this.x += attackerFacing * BLOCK_PUSHBACK; // shoved back, but no stun
      return true;
    }

    this.health = Math.max(0, this.health - attack.damage);
    if (this.health <= 0) {
      this.setState('ko');
    } else {
      this.setState('hurt');
      this.vx = attackerFacing * attack.knockback;
    }
    return false;
  }

  // ---- drawing -----------------------------------------------------

  draw(ctx) {
    const frame = this.animator.frame;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1); // sprites are drawn facing right; flip when facing left

    if (frame) {
      const w = frame.width * SPRITE_SCALE;
      const h = frame.height * SPRITE_SCALE;
      ctx.drawImage(frame, -w / 2, -h, w, h); // anchored bottom-center at the feet
    } else {
      this.drawPlaceholder(ctx);
    }
    ctx.restore();
  }

  // Simple readable stand-in until hand-drawn frames exist for this state.
  drawPlaceholder(ctx) {
    const w = FIGHTER_SIZE.width;
    const h = this.crouching ? FIGHTER_SIZE.crouchHeight : FIGHTER_SIZE.height;
    const lyingDown = this.isKO;

    ctx.fillStyle = this.color;
    if (lyingDown) {
      ctx.fillRect(-h / 2, -w, h, w); // fallen over
    } else {
      ctx.fillRect(-w / 2, -h, w, h);
      // eye dot so you can see which way it faces
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(w * 0.22, -h * 0.85, 7, 0, Math.PI * 2);
      ctx.fill();
      // hurt flash
      if (this.state === 'hurt') {
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(-w / 2, -h, w, h);
      }
      // extended "arm" while an attack is in its active window
      if (this.attack && this.isAttackActive()) {
        const hb = { high: -h * 0.8, mid: -h * 0.5, low: -h * 0.18 }[this.attack.height];
        ctx.fillStyle = '#ffe28a';
        ctx.fillRect(w * 0.2, hb - 12, this.attack.range - w * 0.2, 24);
      }
      // shield line while blocking
      if (this.state === 'block' || this.state === 'blockLow') {
        ctx.strokeStyle = '#8ecdff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(w * 0.62, -h);
        ctx.lineTo(w * 0.62, 0);
        ctx.stroke();
      }
    }
  }
}
