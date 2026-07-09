import { ATTACKS } from '../config.js';

const NEUTRAL = {
  left: false, right: false, crouch: false, block: false,
  jump: false, punch: false, kick: false, special: false,
};

// A deliberately simple AI: walks into range, throws random attacks,
// sometimes blocks when you swing. Plenty of TODOs to make it smarter.
export class AIController {
  constructor(fighter, opponent) {
    this.fighter = fighter;
    this.opponent = opponent;
    this.decisionTimer = 0;
    this.plan = { ...NEUTRAL };
  }

  getCommands(dt) {
    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.18 + Math.random() * 0.2; // "reaction time"
      this.plan = this.decide();
    }
    // One-shot commands (attacks/jump) should not repeat every frame
    const cmd = { ...this.plan };
    this.plan.punch = this.plan.kick = this.plan.special = this.plan.jump = false;
    return cmd;
  }

  decide() {
    const me = this.fighter;
    const foe = this.opponent;
    const dist = Math.abs(foe.x - me.x);
    const towardFoe = foe.x > me.x ? 'right' : 'left';
    const cmd = { ...NEUTRAL };

    // Opponent is swinging and close — sometimes block (guess high or low)
    if (foe.attack && dist < 260 && Math.random() < 0.45) {
      cmd.block = true;
      cmd.crouch = Math.random() < 0.5;
      return cmd;
    }

    // Out of range — walk in
    if (dist > ATTACKS.kick.range) {
      cmd[towardFoe] = true;
      return cmd;
    }

    // In range — pick a random attack, occasionally back off
    const roll = Math.random();
    if (roll < 0.35) cmd.punch = true;
    else if (roll < 0.6) cmd.kick = true;
    else if (roll < 0.75) cmd.special = true;
    else cmd[towardFoe === 'right' ? 'left' : 'right'] = true; // retreat

    // TODO: punish whiffed attacks, use special at range, adapt to player habits
    return cmd;
  }
}
