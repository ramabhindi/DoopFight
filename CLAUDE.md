# DoopFight — architecture cheat sheet

2D 1v1 fighter. Vanilla JS + Canvas, ES modules, no build step. Run: VSCode Live Server on index.html. Deployed to GitHub Pages (push to main → live in ~2 min, hard-refresh to bypass cache).

## Files
- `js/config.js` — ALL tuning: canvas/world size, physics, attacks (incl. punchLow/kickLow), block rules (25% chip), CHARGE gains, keymaps (Q/M = supers), FIGHTERS roster (12 fighters: stats, colors, desc, gimmick flags)
- `js/supers.js` — SUPERS data (2 per fighter: id/name/desc/charges), effect functions in EFFECTS map keyed by id, getEquipped/setEquipped (localStorage)
- `js/fighter.js` — state machine (idle/walk/jump/crouch/block/blockLow/attacks/hurt/ko), statuses system (stun, dot, speedMult, forceCrouch, invertControls, dash, maxhp, exoregen...), takeHit returns 'hit'|'blocked'|'missed', bonusHealth (Maxey), charge fields
- `js/game.js` — flow: menu → select → roundStart → fighting → roundEnd → matchEnd. Owns projectiles/zones/hazards, awardCharges, tryActivateSuper, camera (camX follows fighters across 2200px world)
- `js/select.js` / `js/menu.js` / `js/info.js` — golden-frame nav screens (WASD/arrows + Shift confirm, Esc back). info.js has stat bars + super equip UI
- `js/ui.js` — HUD: health bars (per-fighter max), timer, round pips, super meter circles, banners
- `js/projectile.js` — fireballs etc. (duckable/unblockable flags); `js/stage.js` — 3-layer parallax; `js/sprites.js` — auto-discovers frames; `js/controllers/` — keyboard + simple AI

## Conventions
- Sprites: `assets/sprites/<slug>/<anim>_<n>.png`, drawn facing RIGHT, auto-discovered (no config). Fireball frames: `FB001.png+` in fighter folder. Stage: `assets/stages/background|ground|foreground.png` (parallax speed from image width). UI art: `assets/ui/frame.png`, super icons `assets/ui/supers/<superId>.png`
- Placeholders everywhere: missing art = colored boxes; game must always run without art
- Block rules: standing blocks high+mid; low block (Shift+crouch) blocks low+mid; high attacks whiff vs crouchers; blocked = 25% damage
- Charges: land unblocked +1, land blocked +0.25, block +0.25, receive unblocked +0.5. Meter persists across rounds; statuses/zones/hazards reset each round
- Verify changes by driving the Game class manually via preview_eval (preview tab is hidden → rAF paused, screenshots time out; use pixel sampling/state asserts instead)
