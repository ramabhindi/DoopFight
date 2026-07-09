# DoopFight

A 2D one-on-one fighting game with hand-drawn sprites. Vanilla JavaScript + HTML5 Canvas, no build step.

## Running it

1. Open this folder in VSCode.
2. Install the **Live Server** extension (it's in the recommended extensions popup).
3. Right-click `index.html` → **Open with Live Server**.

The page auto-reloads whenever you save code or drop in new sprite frames.

## Controls

|            | P1        | P2          |
|------------|-----------|-------------|
| Move       | A / D     | ← / →       |
| Jump       | W         | ↑           |
| Crouch     | S         | ↓           |
| Punch      | F         | ,           |
| Kick       | G         | .           |
| Special    | H         | /           |
| Block      | Left Shift| Right Shift |

**Block + Crouch = low block.** Standing block stops high/mid attacks; low block stops low/mid attacks.

On the title screen, move the golden frame with W/S (or ↑/↓) and confirm with **SHIFT**: Single Player, Multiplayer, or Fighter Info. 99-second rounds, first to 2 round wins.

## Fighters

Every fighter has their own **health, speed, and damage** (see the Fighter Info screen in-game, or `FIGHTERS` in [js/config.js](js/config.js)). Health bars drain relative to each fighter's own max. Notable rules already implemented:

- **DOOPY** — H fires a fireball projectile (frames `FB001.png`-`FB005.png` in his sprite folder). It flies toward the opponent, can be blocked standing, and is **dodged entirely by crouching**.
- **RIO** — triple jump (press jump again up to twice mid-air).
- **GUYBO** — cannot jump at all.
- **BIG BIFF** — damage is rolled 0-100 on every hit.
- **SPINMAN** — damage multiplies by the round number (1x / 2x / 3x).

The other gimmicks in the fighter descriptions (Slam's cheese meter, Malu's milk bones, Maxey's kickoff, UltraViolet's buff, Rio's heal) are marked as TODOs in the config for later.

Any fighter can get a fireball: add `special: 'fireball'` to their config entry and drop `FB001.png`, `FB002.png`, ... into their sprite folder.

## Character select

After the title screen: WASD or arrows move the golden frame, **SHIFT confirms**. P1 picks first, then P2 (or the CPU picks at random). The roster lives in `FIGHTERS` in [js/config.js](js/config.js) — 12 fighters, each with a name, a sprite folder (`slug`), and a placeholder color:

DOOPY, RIO, BIG BIFF, GUYBO, ULTRAVIOLET, SLAM (left grid) · MALU, DIPPY, GEEZER, SPINMAN, R.B., MISTER MAXEY (right grid)

Optional select-screen art (used automatically once the file exists):
- `assets/ui/frame.png` — your golden cursor frame

## Adding your hand-drawn sprites

Frames are auto-discovered — no code changes needed:

1. Draw a frame **facing right** (the game flips it automatically).
2. Export as PNG with a transparent background.
3. Save it in that fighter's folder, `assets/sprites/<slug>/<animation>_<number>.png`, numbered from 0:
   - `assets/sprites/doopy/idle_0.png`, `idle_1.png`, `idle_2.png`, ...
4. Reload — done. Animations without any frames yet show a colored placeholder box.

Animation names the game looks for:
`idle, walk, jump, crouch, block, blockLow, punch, kick, special, hurt, ko`

Frames are drawn anchored at the fighter's feet, so keep the ground line at the bottom edge of each PNG and use a consistent canvas size for all frames (something around 300–400 px tall works well). Adjust `SPRITE_SCALE` in `js/config.js` if your art comes out too big or small.

## Stage art (parallax layers)

The arena is wider than the screen (`WORLD.width` in config, 2200px) and the camera follows the fighters. The stage is three PNG layers in `assets/stages/`, all 720px tall, bottom-aligned:

| File | What it is | Width | Notes |
|------|------------|-------|-------|
| `background.png` | Far scenery: sky, buildings, crowd | ~1600px | Opaque — no transparency needed |
| `ground.png` | The walking ground the fighters stand on | exactly 2200px | Transparent above the ground; floor line is at y=660 |
| `foreground.png` | Near props drawn in front of the fighters | ~2600px | Mostly transparent — bushes, railings, dust |

**Always export PNG** (JPEG has no transparency and blurs clean line art).

Parallax speed is automatic from image width: a 1280px-wide layer is pinned to the screen, a 2200px layer scrolls 1:1 with the ground, wider scrolls faster (feels closer). So you control depth just by how wide you draw each layer. Missing layers fall back to placeholder art.

## Tuning the game

Nearly every number lives in [js/config.js](js/config.js): walk speed, jump height, damage, attack speed/range, round time, animation FPS, and key bindings. Change a value, save, and Live Server reloads.

## Code map

| File | What it does |
|------|--------------|
| `js/main.js` | Bootstraps everything and runs the frame loop |
| `js/game.js` | Match flow: menu → select → rounds → KO → winner; hit resolution |
| `js/menu.js` | Title menu (Single Player / Multiplayer / Fighter Info) |
| `js/select.js` | Character select screen (grids, cursor, picks) |
| `js/info.js` | Fighter Info screen (stats bars, descriptions) |
| `js/projectile.js` | Fireballs in flight |
| `js/fighter.js` | Fighter state machine, movement, attacks, hit/hurtboxes, drawing |
| `js/sprites.js` | Auto-discovers and plays your PNG animation frames |
| `js/controllers/keyboard.js` | Maps keys → fighter commands |
| `js/controllers/ai.js` | Simple CPU opponent (walk in, attack, sometimes block) |
| `js/stage.js` | Background drawing |
| `js/ui.js` | Health bars, timer, round pips, menus, banners |
| `js/input.js` | Raw keyboard tracking |
| `js/config.js` | All tuning numbers and key bindings |
