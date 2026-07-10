import { CANVAS, MATCH } from './config.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

// All HUD / overlay drawing. Reads state from the Game object.
export class UI {
  drawHUD(ctx, game) {
    const [p1, p2] = game.fighters;
    this.drawHealthBar(ctx, p1, 40, false, game.wins[0]);
    this.drawHealthBar(ctx, p2, CANVAS.width - 40 - 480, true, game.wins[1]);
    this.drawTimer(ctx, game.timer);
  }

  drawHealthBar(ctx, fighter, x, mirrored, wins) {
    const w = 480, h = 32, y = 30;
    // Bar shows the fighter's own max health (GUYBO's 200 fills the same bar as RIO's 35)
    const pct = fighter.health / fighter.maxHealth;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = '#5b1220';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = pct > 0.35 ? '#ffd23e' : '#ff5b5b';
    const fill = w * pct;
    // Bars drain toward the center of the screen
    ctx.fillRect(mirrored ? x + (w - fill) : x, y, fill, h);

    ctx.fillStyle = '#fff';
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = mirrored ? 'right' : 'left';
    ctx.fillText(fighter.name, mirrored ? x + w : x, y + h + 24);

    // Round-win pips
    for (let i = 0; i < MATCH.roundsToWin; i++) {
      const px = mirrored ? x + w - 14 - i * 26 : x + 14 + i * 26;
      ctx.beginPath();
      ctx.arc(px, y + h + 44, 8, 0, Math.PI * 2);
      ctx.fillStyle = i < wins ? '#ffd23e' : 'rgba(255,255,255,0.25)';
      ctx.fill();
    }
  }

  drawTimer(ctx, timer) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(CANVAS.width / 2 - 50, 18, 100, 56);
    ctx.fillStyle = '#fff';
    ctx.font = `bold 40px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.max(0, Math.ceil(timer))), CANVAS.width / 2, 62);
  }

  // Big center text like "Round 1", "FIGHT!", "KO!"
  drawBanner(ctx, text) {
    if (!text) return;
    ctx.font = `bold 96px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(text, CANVAS.width / 2, CANVAS.height / 2 - 60);
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(text, CANVAS.width / 2, CANVAS.height / 2 - 60);
  }

  // (The title menu moved to js/menu.js — golden-frame navigation.)

  // Super meter circles: P1 bottom-left, P2 bottom-right. Fill with
  // charges (unblocked hit = 1); flash READY when the super can fire.
  drawSuperMeters(ctx, game) {
    const [p1, p2] = game.fighters;
    this.drawSuperMeter(ctx, p1, 84, CANVAS.height - 84, 'Q');
    this.drawSuperMeter(ctx, p2, CANVAS.width - 84, CANVAS.height - 84, 'M');
    // ExoSkeleton bonus bar (silver) under each health bar
    if (p1.bonusHealth > 0) this.drawBonusBar(ctx, p1, 40, false);
    if (p2.bonusHealth > 0) this.drawBonusBar(ctx, p2, CANVAS.width - 40 - 480, true);
  }

  drawSuperMeter(ctx, fighter, cx, cy, keyLabel) {
    const s = fighter.superDef;
    if (!s) return;
    const r = 40;
    const pct = Math.min(1, fighter.charge / s.charges);
    const ready = fighter.superReady;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    if (pct > 0) {
      const pulse = ready ? 0.6 + 0.4 * Math.sin(performance.now() / 120) : 1;
      ctx.strokeStyle = ready ? '#ffd23e' : fighter.color;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = ready ? '#ffd23e' : '#fff';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText(keyLabel, cx, cy + 10);
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = ready ? '#ffd23e' : 'rgba(255,255,255,0.7)';
    ctx.fillText(ready ? 'READY!' : `${s.name}`, cx, cy + r + 24);
    if (fighter.chargeLocked) {
      ctx.fillStyle = '#ff5b5b';
      ctx.fillText('LOCKED', cx, cy - r - 12);
    }
  }

  drawBonusBar(ctx, fighter, x, mirrored) {
    const w = 480 * 0.5 * (fighter.bonusHealth / 50); // full suit = half a bar's length
    ctx.fillStyle = '#cfd6dd';
    ctx.fillRect(mirrored ? x + 480 - w : x, 68, w, 7);
  }

  drawMatchEnd(ctx, winnerName) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    this.drawBanner(ctx, `${winnerName} WINS!`);
    ctx.fillStyle = '#fff';
    ctx.font = `28px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Press Enter for menu', CANVAS.width / 2, CANVAS.height / 2 + 40);
  }
}
