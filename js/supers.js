import { WORLD, FIGHTER_SIZE } from './config.js';

// ---------------------------------------------------------------
// Super attacks. Every fighter has two; the equipped one is chosen
// in the Fighter Info screen and remembered in localStorage.
// The meter fills from charges (see CHARGE in config.js) and fires
// with Q (P1 / vs CPU) or M (P2).
//
// Icon art (optional, auto-detected once the file exists):
//   assets/ui/supers/<id>.png   e.g. assets/ui/supers/animated.png
// ---------------------------------------------------------------

export const SUPERS = {
  doopy: [
    { id: 'animated', name: 'The Animated', charges: 6,
      desc: "Doopy takes advantage of living in an animated world! Doopy speeds up to 24 frames per second, leaving the 12 frame world behind! For 5 seconds, Doopy lives in slow motion, and his speed doubles." },
    { id: 'viral', name: 'Viral Sensation', charges: 6,
      desc: "Doopy's opponent is stuck doomscrolling! The opponent is stunned and cannot move or attack for 2.5 seconds." },
  ],
  rio: [
    { id: 'roost', name: 'Roost', charges: 3,
      desc: "Rio takes a nap. He can't move for 3 seconds, but he will restore to full health." },
    { id: 'whiterain', name: 'White Rain', charges: 4,
      desc: "Rio calls his friends to fly by. They just had Taco Bell. The opponent takes 5 damage per second for 6 seconds." },
  ],
  bigbiff: [
    { id: 'logic', name: 'Logic', charges: 5,
      desc: "Big Biff solves a calculation that deals an un-blockable 35 damage to the opponent, as a projectile of mass calculations." },
    { id: 'betterbiff', name: 'Better Biff', charges: 5,
      desc: "Big Biff solves a calculation that reduces his chances of getting hit. All damage received by Big Biff is reduced by 10 until Big Biff is knocked out. This ability is stackable." },
  ],
  guybo: [
    { id: 'laser', name: 'Laser Eyes', charges: 5,
      desc: "Guybo launches lasers out of his eyes. Attacks for 45 damage, and leaves the opponent burned, dealing 5 damage per second for 3 seconds. The laser is blockable, but the burn damage isn't." },
    { id: 'pimped', name: 'Pimped Ride', charges: 3,
      desc: "Guybo grows wheels and gets a spring, fixing his biggest flaw of movement speed and jumping. Guybo gets 100 movespeed and can jump for 5 seconds." },
  ],
  ultraviolet: [
    { id: 'stagelights', name: 'Stage Lights', charges: 6,
      desc: "UltraViolet activates stage lights that shine 2 rays of light in the battlefield for 30 seconds. While standing in the rays, UltraViolet gains 5 health per second." },
    { id: 'uvlights', name: 'UV Lights', charges: 6,
      desc: "UltraViolet activates stage lights that shine 2 rays of light in the battlefield for 30 seconds. While an opponent stands in the rays, they lose 5 health per second." },
  ],
  slam: [
    { id: 'staydown', name: 'Stay Down', charges: 3,
      desc: "The opponent is locked from jumping or standing for 5 seconds, and is forced to crouch." },
    { id: 'superslam', name: 'SuperSlam', charges: 6,
      desc: "A furious slam that shakes up the entire battlefield. The initial punch if landed deals 50 damage, with a 10 damage shockwave unblockable. Slam will be stunned for 1 second upon using this attack." },
  ],
  malu: [
    { id: 'fetch', name: 'Fetch!', charges: 3,
      desc: "A hand comes out to toss a bone off screen. Malu dashes towards it, slamming into anything that gets in his way. Malu cannot be damaged while dashing. Dashing past opponents deals 20 damage to them, but can be blocked." },
    { id: 'lockjaw', name: 'LockJaw', charges: 4,
      desc: "Malu's next attack has 200% range." },
  ],
  dippy: [
    { id: 'frisk', name: 'Frisk Frames', charges: 4.5,
      desc: "Dippy searches for their opponents' weapons and temporarily confiscates them. Opponents lose 40% of their damage and take 20% more damage for 4 seconds." },
    { id: 'lowopacity', name: 'Low Opacity', charges: 3.25,
      desc: "The next attack Dippy is hit by deals no damage and no knockback." },
  ],
  geezer: [
    { id: 'dementia', name: 'Dementia', charges: 1,
      desc: "He claims he forgot what it does. He says he last used it in the '80s." },
    { id: 'medication', name: 'Medication', charges: 3,
      desc: "Randomly gives a buff to geezer. The options are: 100% max health upgrade + full heal, 100% damage boost, or a 500% speed boost. Buffs last for 5 seconds." },
  ],
  spinman: [
    { id: 'gambler', name: 'The Gambler', charges: 4.5,
      desc: "Spinman gambles his next attack's damage value! Spinman's next attack's damage is multiplied by either 2, 3, 4 or even 5x! (Wheel determines attack damage multiplier)" },
    { id: 'heatcheck', name: 'Heat Check', charges: 4,
      desc: "Spinman's damage will go up by 5 for every attack he lands after activating this super attack (blocked or not). Once Spinman gets dealt an attack that is not blocked, the damage returns to normal." },
  ],
  rb: [
    { id: 'copycat', name: 'Copycat', charges: 5.5,
      desc: "The opponents super becomes your super! R.B copies his opponents super and uses it to his own advantage." },
    { id: 'rblocks', name: 'RB Locks', charges: 6,
      desc: "The opponent's super attack bar gets locked until they are able to land an attack on R.B. They cannot generate charges until an unblocked attack lands." },
  ],
  mistermaxey: [
    { id: 'exoskeleton', name: 'ExoSkeleton', charges: 5,
      desc: "Mister Maxey puts on the exoskeleton suit that he's been working on. Mister Maxey is granted a bonus health bar (silver) that regenerates 2 health per second, and has a total health of 50." },
    { id: 'shopvac', name: 'Shop Vac Reversal', charges: 3.5,
      desc: "Mister Maxey shoots out all of the debris inside of his Shop Vac! Bolts, nuts, and other debris litter the battlefield, dealing 5 damage for each one the opponent steps on. (Can be jumped over)." },
  ],
};

// ---- equipped super per fighter (persisted across sessions) --------

const STORE_KEY = 'doopfight.supers';
let equipped = {};
try { equipped = JSON.parse(localStorage.getItem(STORE_KEY)) ?? {}; } catch { /* fresh start */ }

export function getEquipped(slug) { return equipped[slug] === 1 ? 1 : 0; }
export function setEquipped(slug, idx) {
  equipped[slug] = idx;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(equipped)); } catch { /* private mode etc. */ }
}

// ---- effects --------------------------------------------------------
// Each effect gets (game, self, opponent). Timed things use the fighter
// status system; battlefield things (zones, hazards, projectiles) go
// through the game.

const EFFECTS = {
  // DOOPY
  animated(g, s) { s.addStatus('speedMult', 5, { mult: 2 }); },
  viral(g, s, o) { o.addStatus('stun', 2.5); },

  // RIO
  roost(g, s) { s.heal(s.maxHealth); s.addStatus('stun', 3); },
  whiterain(g, s, o) { o.addStatus('dot', 6, { dps: 5 }); },

  // BIG BIFF
  logic(g, s) {
    g.spawnSuperProjectile(s, { damage: 35, unblockable: true, duckable: false, color: '#f2f2f2' });
  },
  betterbiff(g, s) { s.flatReduction += 10; }, // stackable; resets when KO'd (new round)

  // GUYBO
  laser(g, s, o) {
    const dir = o.x >= s.x ? 1 : -1;
    const result = o.takeHit({ name: 'laser', damage: 45, height: 'mid', knockback: 320 }, dir);
    g.awardCharges(s, o, result);
    o.addStatus('dot', 3, { dps: 5 }); // the burn is unblockable
  },
  pimped(g, s) {
    s.addStatus('speedMult', 5, { mult: 100 / (s.def.speed ?? 70) }); // = 100 movespeed
    s.addStatus('canJump', 5);
  },

  // ULTRAVIOLET
  stagelights(g, s) { g.spawnZones(s, 'heal'); },
  uvlights(g, s) { g.spawnZones(s, 'hurt'); },

  // SLAM
  staydown(g, s, o) { o.addStatus('forceCrouch', 5); },
  superslam(g, s, o) {
    const dir = o.x >= s.x ? 1 : -1;
    if (Math.abs(o.x - s.x) < 260) {
      const result = o.takeHit({ name: 'superslam', damage: 50, height: 'mid', knockback: 420 }, dir);
      g.awardCharges(s, o, result);
    }
    o.applyDamage(10); // battlefield shockwave, unblockable
    s.addStatus('stun', 1);
  },

  // MALU
  fetch(g, s) { s.addStatus('dash', 0.55, { dir: s.facing, hasHit: false }); },
  lockjaw(g, s) { s.nextAttackRangeMult = 2; },

  // DIPPY
  frisk(g, s, o) {
    o.addStatus('damageDealtMult', 4, { mult: 0.6 });
    o.addStatus('damageTakenMult', 4, { mult: 1.2 });
  },
  lowopacity(g, s) { s.negateNextHit = true; },

  // GEEZER
  dementia(g, s, o) { o.addStatus('invertControls', 5); }, // he "forgot" what it does
  medication(g, s) {
    const roll = Math.floor(Math.random() * 3);
    if (roll === 0) { s.addStatus('maxhp', 5, { prev: s.maxHealth }); s.maxHealth *= 2; s.heal(s.maxHealth); }
    else if (roll === 1) s.addStatus('damageDealtMult', 5, { mult: 2 });
    else s.addStatus('speedMult', 5, { mult: 6 });
  },

  // SPINMAN
  gambler(g, s) { s.nextAttackDamageMult = 2 + Math.floor(Math.random() * 4); }, // 2x-5x
  heatcheck(g, s) { s.heatCheck = { bonus: 0 }; },

  // R.B.
  copycat(g, s, o) {
    const theirs = o.superDef;
    if (theirs && theirs.id !== 'copycat') EFFECTS[theirs.id]?.(g, s, o);
  },
  rblocks(g, s, o) { o.chargeLocked = true; }, // cleared when they land an unblocked hit

  // MISTER MAXEY
  exoskeleton(g, s) {
    s.bonusHealth = 50;
    s.addStatus('exoregen', 9999, {}); // regen lives until the bonus bar is destroyed
  },
  shopvac(g, s) { g.spawnHazards(s); },
};

export function applySuper(game, self, opponent, superDef) {
  EFFECTS[superDef.id]?.(game, self, opponent);
}
