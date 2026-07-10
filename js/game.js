import { CANVAS, WORLD, CAMERA, MATCH, FIGHTER_SIZE, FIGHTERS, PROJECTILE, CHARGE, STAGE } from './config.js';
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
import { SUPERS, getEquipped, applySuper } from './supers.js';

const NEUTRAL = {
  left: false, right: false, crouch: false, block: false,
  jump: false, punch: false, kick: false, special: false, superAtk: false,
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
    this.projectiles = []; // live fireballs / calculations
    this.zones = [];       // UltraViolet's light rays
    this.hazards = [];     // Mister Maxey's shop vac debris

    this.state = 'menu';
    this.stateTime = 0;
    this.banner = '';
    this.bannerTime = 0;
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

  flashBanner(text, time = 1.4) {
    this.banner = text;
    this.bannerTime = time;
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
    // Equipped supers (chosen in the Fighter Info screen)
    f1.superDef = SUPERS[p1.def.slug][getEquipped(p1.def.slug)];
    f2.superDef = SUPERS[p2.def.slug][getEquipped(p2.def.slug)];
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
    this.zones = [];
    this.hazards = [];
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
          this.flashBanner('FIGHT!', 0.8);
          this.setState('fighting');
        }
        break;

      case 'fighting':
        this.bannerTime -= dt;
        if (this.bannerTime <= 0) this.banner = '';
        this.updateFighters(dt, false);
        this.separateBodies();
        this.resolveHits(this.fighters[0], this.fighters[1]);
        this.resolveHits(this.fighters[1], this.fighters[0]);
        this.resolveDashHits();
        this.updateProjectiles(dt);
        this.updateZones(dt);
        this.updateHazards();

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
    const cmdA = frozen ? NEUTRAL : this.adjustCommands(a, this.controllers[0].getCommands(dt));
    const cmdB = frozen ? NEUTRAL : this.adjustCommands(b, this.controllers[1].getCommands(dt));
    a.update(dt, cmdA, b);
    b.update(dt, cmdB, a);
    if (!frozen) {
      if (cmdA.superAtk) this.tryActivateSuper(0);
      if (cmdB.superAtk) this.tryActivateSuper(1);
    }
  }

  // Status effects that mess with a fighter's inputs (supers)
  adjustCommands(fighter, cmd) {
    let out = cmd;
    if (fighter.hasStatus('invertControls')) { // GEEZER's Dementia
      out = { ...out, left: out.right, right: out.left };
    }
    if (fighter.hasStatus('forceCrouch')) {    // SLAM's Stay Down
      out = { ...out, crouch: true, jump: false };
    }
    return out;
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

  tryActivateSuper(i) {
    const f = this.fighters[i];
    const opp = this.fighters[1 - i];
    if (!f.superReady || !f.canAct() || f.isKO) return;
    f.charge = 0;
    applySuper(this, f, opp, f.superDef);
    this.flashBanner(`${f.superDef.name.toUpperCase()}!`);
  }

  // ---- super battlefield helpers ------------------------------------

  // Charge gains: land unblocked +1 · land blocked +0.25 ·
  // block an attack +0.25 · receive unblocked +0.5
  awardCharges(attacker, defender, result) {
    if (result === 'hit') {
      attacker.chargeLocked = false; // RB Locks lifts on landing an unblocked hit
      this.addCharge(attacker, CHARGE.landUnblocked);
      this.addCharge(defender, CHARGE.receiveUnblocked);
      if (attacker.heatCheck) attacker.heatCheck.bonus += 5;
      if (defender.heatCheck) defender.heatCheck = null; // Heat Check ends when hit unblocked
    } else if (result === 'blocked') {
      this.addCharge(attacker, CHARGE.landBlocked);
      this.addCharge(defender, CHARGE.blockAttack);
      if (attacker.heatCheck) attacker.heatCheck.bonus += 5; // "blocked or not"
    }
  }

  addCharge(f, amount) {
    if (f.chargeLocked || !f.superDef) return;
    f.charge = Math.min(f.superDef.charges, f.charge + amount);
  }

  spawnSuperProjectile(owner, opts) {
    this.projectiles.push(new Projectile({
      x: owner.x + owner.facing * (FIGHTER_SIZE.width / 2 + 30),
      y: owner.y - FIGHTER_SIZE.crouchHeight * 0.5, // low enough that crouching can't dodge it
      dir: owner.facing,
      owner,
      frames: [],
      ...opts,
    }));
  }

  spawnZones(owner, mode) { // UltraViolet's Stage Lights / UV Lights
    for (let i = 0; i < 2; i++) {
      this.zones.push({
        x: 300 + Math.random() * (WORLD.width - 600),
        w: 150, time: 30, mode, owner,
      });
    }
  }

  spawnHazards(owner) { // Mister Maxey's Shop Vac Reversal
    for (let i = 0; i < 6; i++) {
      this.hazards.push({ x: 200 + Math.random() * (WORLD.width - 400), owner });
    }
  }

  updateZones(dt) {
    for (const z of this.zones) {
      z.time -= dt;
      for (const f of this.fighters) {
        if (f.isKO || Math.abs(f.x - z.x) > z.w / 2) continue;
        if (z.mode === 'heal' && f === z.owner) f.heal(5 * dt);
        if (z.mode === 'hurt' && f !== z.owner) f.applyDamage(5 * dt);
      }
    }
    this.zones = this.zones.filter((z) => z.time > 0);
  }

  updateHazards() {
    this.hazards = this.hazards.filter((hz) => {
      const target = this.fighters.find((f) => f !== hz.owner);
      if (target && target.grounded && !target.isKO && Math.abs(target.x - hz.x) < 45) {
        target.applyDamage(5); // stepped on debris (jump over it!)
        return false;
      }
      return true;
    });
  }

  // MALU's Fetch! dash: damages an opponent it passes through (once)
  resolveDashHits() {
    for (const f of this.fighters) {
      const dash = f.getStatus('dash');
      if (!dash || dash.data.hasHit) continue;
      const opp = this.fighters.find((o) => o !== f);
      if (rectsOverlap(f.hurtbox(), opp.hurtbox())) {
        dash.data.hasHit = true;
        const result = opp.takeHit(
          { name: 'fetch', damage: 20, height: 'mid', knockback: 260 }, dash.data.dir);
        this.awardCharges(f, opp, result);
      }
    }
  }

  // Fireballs: spawn them when a projectile special's startup ends,
  // fly them across the stage, and resolve hits. Ducking dodges them
  // (unless the projectile says otherwise — BIG BIFF's Logic).
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
      const ducked = p.duckable && target.crouching;
      if (p.active && !ducked && !target.isKO &&
          rectsOverlap(p.rect(), target.hurtbox())) {
        const result = target.takeHit(
          { name: 'projectile', damage: p.damage, height: p.duckable ? 'high' : 'mid',
            knockback: PROJECTILE.knockback, unblockable: p.unblockable },
          p.dir,
        );
        if (result !== 'missed') {
          this.awardCharges(p.owner, target, result);
          p.active = false;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  resolveHits(attacker, defender) {
    if (!attacker.isAttackActive()) return;
    if (!rectsOverlap(attacker.hitbox(), defender.hurtbox())) return;
    const result = defender.takeHit(attacker.attack, attacker.facing);
    // A ducked-under punch stays live — it can still connect if they stand up
    if (result === 'missed') return;
    attacker.attackHasHit = true;
    this.awardCharges(attacker, defender, result);
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
    this.drawZones(ctx);
    this.drawHazards(ctx);
    for (const f of this.fighters) f.draw(ctx);
    for (const p of this.projectiles) p.draw(ctx);
    ctx.restore();

    // Foreground layer passes in FRONT of the fighters
    this.stage.drawForeground(ctx, this.camX);

    this.ui.drawHUD(ctx, this);
    this.ui.drawSuperMeters(ctx, this);

    if (this.state === 'matchEnd') {
      this.ui.drawMatchEnd(ctx, this.matchWinner.name);
    } else {
      this.ui.drawBanner(ctx, this.banner);
    }
  }

  drawZones(ctx) {
    for (const z of this.zones) {
      const grad = ctx.createLinearGradient(0, 0, 0, STAGE.floorY);
      const c = z.mode === 'heal' ? '255, 235, 130' : '170, 80, 255';
      grad.addColorStop(0, `rgba(${c}, 0.55)`);
      grad.addColorStop(1, `rgba(${c}, 0.15)`);
      ctx.fillStyle = grad;
      ctx.fillRect(z.x - z.w / 2, 0, z.w, STAGE.floorY);
    }
  }

  drawHazards(ctx) {
    ctx.fillStyle = '#9aa0a6';
    for (const hz of this.hazards) {
      ctx.beginPath();
      ctx.arc(hz.x, STAGE.floorY - 8, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
