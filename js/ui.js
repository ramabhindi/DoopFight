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
