// ============================================================
// DoopFight — central tuning file.
// Almost everything about game feel lives here. Tweak freely.
// ============================================================

export const CANVAS = { width: 1280, height: 720 };

// The fightable world is wider than the screen; the camera follows the
// midpoint between the two fighters and the stage layers parallax-scroll.
export const WORLD = {
  width: 2200,
};

export const CAMERA = {
  smoothing: 8,       // higher = snappier follow, lower = floatier
};

export const STAGE = {
  floorY: 660,        // y-coordinate the fighters stand on
  wallPadding: 60,    // how close to the world edges fighters can walk
};

// Selectable fight stages (see mapselect.js for the 2x3 picker screen).
// Each layer is either { type: 'static', src } (one PNG) or
// { type: 'animated', prefix, fps } (auto-discovers assets/stages/<prefix>0000.png,
// <prefix>0001.png, ... and loops). A layer of `null` just isn't drawn —
// Stage falls back to its placeholder, same as any other missing art.
// `music` is the track that plays during the fight; `null` means none yet.
export const MAPS = [
  {
    id: 'lobby', name: 'The Lobby', thumbnail: null,
    background: { type: 'static', src: 'assets/stages/background.png' },
    ground: { type: 'static', src: 'assets/stages/ground.png' },
    foreground: { type: 'static', src: 'assets/stages/foreground.png' },
    music: null,
  },
  {
    id: 'nightclub', name: 'The Nightclub', thumbnail: 'assets/stages/ThumbnailDiscoDance.png',
    background: { type: 'animated', prefix: 'DiscoDanceBG', fps: 10 },
    ground: { type: 'animated', prefix: 'DiscoDanceGround', fps: 10, yOffset: 25 },
    foreground: { type: 'animated', prefix: 'DiscoDanceForeground', fps: 10 },
    music: 'assets/audio/NightClub_SoundTrack.mp3',
  },
  { id: 'casino', name: 'The Casino', thumbnail: null, background: null, ground: null, foreground: null, music: null },
  { id: 'cage',   name: 'The Cage',   thumbnail: null, background: null, ground: null, foreground: null, music: null },
  { id: 'zoo',    name: 'The Zoo',    thumbnail: null, background: null, ground: null, foreground: null, music: null },
  { id: 'hq',     name: 'The HQ',     thumbnail: null, background: null, ground: null, foreground: null, music: null },
];

export const PHYSICS = {
  gravity: 3000,      // px/s^2
  walkSpeed: 320,     // px/s
  jumpVelocity: -1050, // px/s (negative = up)
};

export const MATCH = {
  roundTime: 99,      // seconds per round
  roundsToWin: 2,     // best of 3
  maxHealth: 100,
};

// ------------------------------------------------------------
// Attacks. Times are in seconds:
//   startup  = wind-up before the hit comes out
//   active   = the window where the hitbox can connect
//   recovery = cooldown after, where you're vulnerable
// height: 'high' | 'mid' | 'low'
//   standing block stops high + mid, low block (Shift+crouch) stops low + mid.
// ------------------------------------------------------------
export const ATTACKS = {
  punch:    { damage: 8,  range: 110, height: 'high', startup: 0.08, active: 0.10, recovery: 0.18, knockback: 120 },
  kick:     { damage: 12, range: 145, height: 'mid',  startup: 0.14, active: 0.12, recovery: 0.26, knockback: 220 },
  special:  { damage: 20, range: 175, height: 'low',  startup: 0.30, active: 0.15, recovery: 0.45, knockback: 400 },
  // Low attacks: punch/kick while holding crouch. They hit LOW, so a
  // standing blocker takes full ("unblocked") damage — only low block stops them.
  punchLow: { damage: 7,  range: 115, height: 'low',  startup: 0.09, active: 0.10, recovery: 0.20, knockback: 100 },
  kickLow:  { damage: 10, range: 150, height: 'low',  startup: 0.15, active: 0.12, recovery: 0.28, knockback: 180 },
};

export const HURT_TIME = 0.35;   // hit-stun duration (seconds)
export const BLOCK_DAMAGE_MULT = 0.25; // blocked attacks still deal 25% of their true damage
export const BLOCK_PUSHBACK = 90; // how far a blocked hit shoves the defender

// Super meter charge gains (1 charge = 1 unblocked hit landed)
export const CHARGE = {
  landUnblocked: 1,
  landBlocked: 0.25,
  blockAttack: 0.25,
  receiveUnblocked: 0.5,
};

// Body collision box, used for hits and pushing until you tune per-sprite.
export const FIGHTER_SIZE = { width: 110, height: 260, crouchHeight: 170 };

// Multiply sprite images by this when drawing (1 = draw at natural size).
export const SPRITE_SCALE = 1;

// ------------------------------------------------------------
// Controls (KeyboardEvent.code values).
// Block is Shift; Shift + crouch = low block.
// ------------------------------------------------------------
export const KEYMAPS = {
  p1: {
    left: 'KeyA', right: 'KeyD', jump: 'KeyW', crouch: 'KeyS',
    block: 'ShiftLeft', punch: 'KeyF', kick: 'KeyG', special: 'KeyH',
    superAtk: 'KeyQ',
  },
  p2: {
    left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', crouch: 'ArrowDown',
    block: 'ShiftRight', punch: 'Comma', kick: 'Period', special: 'Slash',
    superAtk: 'KeyM',
  },
};

// ------------------------------------------------------------
// The fighter roster (character select order: 0-5 left grid, 6-11 right).
//   slug   = sprite folder under assets/sprites/
//   color  = placeholder box color until sprites are drawn
//   health = max HP · speed/damage are on a 0-100 scale (70 = baseline)
//   jumps  = how many jumps before landing (Rio 3, Guybo 0)
//   healthColor/speedColor/damageColor = info-screen bar colors
//     (omit to auto-color by value); 'cycle' animates green<->red
//   speedText/damageText = info-screen display override
//   damageMode: 'random' = 0-100 rolled per hit · 'perRound' = damage x round number
//   special: 'fireball' = H fires a projectile (frames FB001.png+ in the fighter's folder)
// ------------------------------------------------------------
export const FIGHTERS = [
  { name: 'DOOPY', slug: 'doopy', color: '#4aa3ff',
    health: 100, speed: 70, damage: 70,
    healthColor: '#2ecc40', speedColor: '#c8e04a', damageColor: '#7edc3d',
    special: 'fireball',
    desc: "Just another doop who thinks he's got it. All rounder. Fireball projectiles to keep enemies at bay." },

  { name: 'RIO', slug: 'rio', color: '#ff5b5b',
    health: 35, speed: 95, damage: 85, jumps: 3,
    healthColor: '#ff5b30', speedColor: '#2ecc40', damageColor: '#2ecc40',
    // TODO: special that replenishes lost health
    desc: "An honoured squeaker who goes only by the order of their master -- The Cloth. Very fast speeds and high damage output. Specials allow Rio to replenish lost health and have prolonged time in the air." },

  { name: 'BIG BIFF', slug: 'bigbiff', color: '#a9743a',
    health: 70, speed: 70, damage: 50, damageMode: 'random',
    healthColor: '#c8e04a', speedColor: '#c8e04a', damageColor: 'cycle', damageText: '0-100',
    desc: 'Defensive powerhouse who has questionable power. His damage output is randomized!' },

  { name: 'GUYBO', slug: 'guybo', color: '#3ddc84',
    health: 200, speed: 20, damage: 30, jumps: 0,
    healthColor: '#a55eea', speedColor: '#ff4136', damageColor: '#ff4136',
    desc: "Nobody knows where this thing came from or who the heck added it to the game. Guybo is super slow and can't jump, but it trades off for a great health bar." },

  { name: 'ULTRAVIOLET', slug: 'ultraviolet', color: '#9b59ff',
    health: 80, speed: 65, damage: 75,
    // TODO: special that boosts stats for 10 seconds
    desc: 'A guy that has no locks who came to the battlefield to get more money to do some more buy-ins. His special move gives him increased stats for 10 seconds!' },

  { name: 'SLAM', slug: 'slam', color: '#ff9f1c',
    health: 80, speed: 65, damage: 75, damageText: '75+',
    // TODO: "cheesed" meter - 5 unblocked hits taken = triple damage for 3 attacks
    desc: 'Slam has a "cheesed" meter that goes up everytime he takes an unblocked hit! When he takes 5 hits without blocking, his damage triples for his next 3 attacks!' },

  { name: 'MALU', slug: 'malu', color: '#ff6bd6',
    health: 50, speed: 100, damage: 70,
    // TODO: bonus damage vs airborne opponents + 2 milk bones (triple-tap punch heals 20, twice per game)
    desc: 'Malu is the lovliest dog who just wants belly rubs and attention. Rio cheeses him though. He does more damage when his attacks land on airborne opponents. Malu starts the game with 2 milk bones. Triple tapping the punch button will heal you for 20 health, twice per game' },

  { name: 'DIPPY', slug: 'dippy', color: '#ffe14a',
    health: 100, speed: 70, damage: 70,
    healthColor: '#2ecc40', speedColor: '#c8e04a', damageColor: '#7edc3d',
    desc: 'The doop who swore he was going to kill Doopy. Same stats as Doopy.' },

  { name: 'GEEZER', slug: 'geezer', color: '#a8b5b8',
    health: 55, speed: 20, damage: 5,
    desc: 'We didnt have a budget for more fighters, so we got this old dude to volunteer.' },

  { name: 'SPINMAN', slug: 'spinman', color: '#1cd8d2',
    health: 80, speed: 80, damage: 50, damageMode: 'perRound',
    damageFlash: [50, 100, 150],
    desc: "Spinman's part time job. Spinman starts each round with a damage multiplier! Spinman does 1x damage in round 1, 2x damage in round 2, and 3x damage in round 3!" },

  { name: 'R.B.', slug: 'rb', color: '#8e2438',
    health: 90, speed: 70, damage: 70,
    desc: 'The literal GOAT of absolutely everything.' },

  { name: 'MISTER MAXEY', slug: 'mistermaxey', color: '#f2ead9',
    health: 100, speed: 100, damage: 100,
    speedText: '100 · 50 if kickoff lost', damageText: '100 · 50 if kickoff lost',
    // TODO: kickoff rule - stats halve for the round unless Maxey lands the first hit
    desc: 'Mister Maxey has good stats on paper, but only if he wins kickoff. When a round begins, maxey only gets these stats if he lands the first hit. If not, these stats are halved.' },
];

// Baseline for the 0-100 speed/damage scales: a 70 stat = 1x multiplier.
export const BASE_STAT = 70;

export const PROJECTILE = {
  speed: 720,     // px/s
  scale: 2,       // fireball frames are small (64x32); draw them bigger
  fps: 14,
  knockback: 300,
};

// ------------------------------------------------------------
// Animations.
// Frames are AUTO-DISCOVERED from the sprite folders:
//   assets/sprites/fighter1/idle_0.png, idle_1.png, idle_2.png, ...
// Just drop numbered PNGs in and reload — no config needed.
// Draw all sprites FACING RIGHT; the game flips them automatically.
// ------------------------------------------------------------
export const ANIMATION_NAMES = [
  'idle', 'walk', 'jump', 'crouch', 'block', 'blockLow',
  'punch', 'kick', 'special', 'punchLow', 'kickLow', 'hurt', 'ko',
];

export const ANIMATION_DEFAULTS = { fps: 10, loop: true };

// Per-animation overrides for fps / looping.
export const ANIMATION_OVERRIDES = {
  hurt: { loop: false },
  ko:   { loop: false },
  jump: { loop: false },
  // punch: { fps: 16 },   // example: speed up the punch animation
};
