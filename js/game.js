import { CANVAS, WORLD, CAMERA, MATCH, FIGHTER_SIZE, FIGHTERS, PROJECTILE } from './config.js';
import { KEYMAPS } from './config.js';
import { Fighter } from './fighter.js';
import { KeyboardController } from './controllers/keyboard.js';
import { AIController } from './controllers/ai.js';
import { Stage } from './stage.js';
import { UI } from './ui.js';
import { MainMenu } from './menu.js';
import { CharacterSelect } from './select.js';
import { FighterInfo } from './info.js';
import { Projectile } from './projectile.js';
import { loadFighterAnimations, loadPrefixedFrames } from './sprites.js';

const NEUTRAL = {
  left: false, right: false, crouch: false, block: false,
  jump: false, punch: false, kick: false, special: false,
};

function rectsOverlap(a, b) {
  return a && b &&
    a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

// Match flow: menu -> select -> roundStart -> fighting -> roundEnd -> (next round | matchEnd)
export class Game {
  constructor(ctx, keyboard) {
    this.ctx = ctx;
    this.keyboard = keyboard;
    this.stage = new Stage();
    this.ui = new UI();
    this.menu = new MainMenu(keyboard);
    this.select = null;
    this.info = null;
    this.p2Type = 'ai';    // 'ai' | 'human'
    this.loading = false;  // true while fighter sprites load after select
    this.projectiles = []; // live fireballs

    this.state = 'menu';
    this.stateTime = 0;
    this.banner = '';
    this.fighters = [];
    this.controllers = [];
    this.wins = [0, 0];
    this.round = 1;
    this.timer = MATCH.roundTime;
    this.matchWinner = null;
    this.camX = 0; // camera scroll, follows the fighters
  }

  setState(name) {
    this.state = name;
    this.stateTime = 0;
  }

  beginMenu() {
    this.menu = new MainMenu(this.keyboard);
    this.setState('menu');
  }

  beginSelect(p2Type) {
    this.p2Type = p2Type;
    this.select = new CharacterSelect(this.keyboard, p2Type);
    this.setState('select');
  }

  // Both players have picked: load the chosen fighters' sprites, then fight.
  async launchMatch() {
    const p1Def = FIGHTERS[this.select.picks.p1];
    const p2Def = FIGHTERS[this.select.picks.p2];
    const [p1Anims, p2Anims, p1Fireball, p2Fireball] = await Promise.all([
      loadFighterAnimations(p1Def.slug),
      loadFighterAnimations(p2Def.slug),
      loadPrefixedFrames(`assets/sprites/${p1Def.slug}`, 'FB'),
      loadPrefixedFrames(`assets/sprites/${p2Def.slug}`, 'FB'),
    ]);
    this.loading = false;
    this.startMatch(
      { def: p1Def, animations: p1Anims, fireball: p1Fireball },
      { def: p2Def, animations: p2Anims, fireball: p2Fireball },
    );
  }

  startMatch(p1, p2) {
    const isCPU = this.p2Type === 'ai';
    const f1 = new Fighter({
      name: p1.def.name, x: WORLD.width / 2 - 240, facing: 1,
      animations: p1.animations, color: p1.def.color, def: p1.def,
    });
    const f2 = new Fighter({
      name: isCPU ? `${p2.def.name} (CPU)` : p2.def.name, x: WORLD.width / 2 + 240, facing: -1,
      animations: p2.animations, color: p2.def.color, def: p2.def,
    });
    f1.projectileFrames = p1.fireball;
    f2.projectileFrames = p2.fireball;
    this.fighters = [f1, f2];
    this.controllers = [
      new KeyboardController(this.keyboard, KEYMAPS.p1),
      isCPU ? new AIController(f2, f1) : new KeyboardController(this.keyboard, KEYMAPS.p2),
    ];
    this.wins = [0, 0];
    this.round = 1;
    this.matchWinner = null;
    this.startRound();
  }

  startRound() {
    this.fighters[0].resetForRound(WORLD.width / 2 - 240, 1);
    this.fighters[1].resetForRound(WORLD.width / 2 + 240, -1);
    for (const f of this.fighters) f.roundNumber = this.round; // SPINMAN's multiplier
    this.projectiles = [];
    this.timer = MATCH.roundTime;
    this.banner = `ROUND ${this.round}`;
    this.camX = this.cameraTarget(); // snap, don't pan, on round start
    this.setState('roundStart');
  }

  // Where the camera wants to be: fighters' midpoint, clamped to the world.
  cameraTarget() {
    const [a, b] = this.fighters;
    const mid = (a.x + b.x) / 2;
    return Math.min(Math.max(mid - CANVAS.width / 2, 0), WORLD.width - CANVAS.width);
  }

  updateCamera(dt) {
    this.camX += (this.cameraTarget() - this.camX) * Math.min(1, dt * CAMERA.smoothing);
  }

  // ---- update ------------------------------------------------------

  update(dt) {
    this.stateTime += dt;

    switch (this.state) {
      case 'menu':
        this.menu.update();
        if (this.menu.choice === 'single') this.beginSelect('ai');
        else if (this.menu.choice === 'multi') this.beginSelect('human');
        else if (this.menu.choice === 'info') {
          this.info = new FighterInfo(this.keyboard);
          this.setState('info');
        }
        break;

      case 'info':
        this.info.update(dt);
        if (this.info.exit) this.beginMenu();
        break;

      case 'select':
        this.select.update(dt);
        if (this.select.done && !this.loading) {
          this.loading = true;
          this.launchMatch();
        }
        break;

      case 'roundStart':
        this.updateFighters(dt, true); // frozen: physics/animation only
        if (this.stateTime >= 1.2) {
          this.banner = 'FIGHT!';
          this.setState('fighting');
        }
        break;

      case 'fighting':
        if (this.stateTime > 0.8) this.banner = ''; // let "FIGHT!" linger briefly
        this.updateFighters(dt, false);
        this.separateBodies();
        this.resolveHits(this.fighters[0], this.fighters[1]);
        this.resolveHits(this.fighters[1], this.fighters[0]);
        this.updateProjectiles(dt);

        this.timer -= dt;
        if (this.fighters.some((f) => f.isKO)) this.endRound('KO!');
        else if (this.timer <= 0) this.endRound('TIME!');
        break;

      case 'roundEnd':
        this.updateFighters(dt, true);
        if (this.stateTime >= 2.2) {
          const winnerIdx = this.wins[0] > this.wins[1] ? 0 : 1;
          if (this.wins[winnerIdx] >= MATCH.roundsToWin) {
            this.matchWinner = this.fighters[winnerIdx];
            this.setState('matchEnd');
          } else {
            this.round += 1;
            this.startRound();
          }
        }
        break;

      case 'matchEnd':
        if (this.keyboard.wasPressed('Enter')) this.beginMenu();
        break;
    }

    if (this.fighters.length) this.updateCamera(dt);
  }

  // frozen = true keeps gravity + animations running but ignores player input
  updateFighters(dt, frozen) {
    const [a, b] = this.fighters;
    const cmdA = frozen ? NEUTRAL : this.controllers[0].getCommands(dt);
    const cmdB = frozen ? NEUTRAL : this.controllers[1].getCommands(dt);
    a.update(dt, cmdA, b);
    b.update(dt, cmdB, a);
  }

  // Fighters can't stand inside each other — push them apart.
  separateBodies() {
    const [a, b] = this.fighters;
    const gap = Math.abs(a.x - b.x);
    const minGap = FIGHTER_SIZE.width;
    if (gap < minGap) {
      const push = (minGap - gap) / 2;
      const dir = a.x <= b.x ? 1 : -1;
      a.x -= dir * push;
      b.x += dir * push;
    }
  }

  // Fireballs: spawn them when a projectile special's startup ends,
  // fly them across the stage, and resolve hits. Ducking dodges them.
  updateProjectiles(dt) {
    const [a, b] = this.fighters;

    for (const f of this.fighters) {
      const atk = f.attack;
      if (atk?.projectile && !atk.spawned && f.stateTime >= atk.startup) {
        atk.spawned = true;
        this.projectiles.push(new Projectile({
          x: f.x + f.facing * (FIGHTER_SIZE.width / 2 + 30),
          y: f.y - FIGHTER_SIZE.height * 0.55,
          dir: f.facing,
          damage: atk.damage,
          owner: f,
          frames: f.projectileFrames,
        }));
      }
    }

    for (const p of this.projectiles) {
      p.update(dt);
      const target = p.owner === a ? b : a;
      // Crouching (holding S / Down) ducks under the fireball entirely
      if (p.active && !target.crouching && !target.isKO &&
          rectsOverlap(p.rect(), target.hurtbox())) {
        target.takeHit(
          { name: 'fireball', damage: p.damage, height: 'high', knockback: PROJECTILE.knockback },
          p.dir,
        );
        p.active = false;
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  resolveHits(attacker, defender) {
    if (!attacker.isAttackActive()) return;
    if (!rectsOverlap(attacker.hitbox(), defender.hurtbox())) return;
    attacker.attackHasHit = true;
    defender.takeHit(attacker.attack, attacker.facing);
    // TODO: hit sparks, sound effects, screen shake go here
  }

  endRound(bannerText) {
    this.banner = bannerText;
    const [a, b] = this.fighters;
    // Winner = the fighter still standing, or higher health on time-out (draws go to P1 for now)
    const winnerIdx = a.isKO ? 1 : b.isKO ? 0 : (a.health >= b.health ? 0 : 1);
    this.wins[winnerIdx] += 1;
    this.setState('roundEnd');
  }

  // ---- drawing -----------------------------------------------------

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    this.stage.drawBackground(ctx, this.camX);

    if (this.state === 'menu') {
      this.menu.draw(ctx);
      return;
    }
    if (this.state === 'select') {
      this.select.draw(ctx);
      return;
    }
    if (this.state === 'info') {
      this.info.draw(ctx);
      return;
    }

    // Fighters and projectiles live in world space; shift them by the camera
    ctx.save();
    ctx.translate(-this.camX, 0);
    for (const f of this.fighters) f.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
    ctx.restore();

    // Foreground layer passes in FRONT of the fighters
    this.stage.drawForeground(ctx, this.camX);

    this.ui.drawHUD(ctx, this);

    if (this.state === 'matchEnd') {
      this.ui.drawMatchEnd(ctx, this.matchWinner.name);
    } else {
      this.ui.drawBanner(ctx, this.banner);
    }
  }
}
