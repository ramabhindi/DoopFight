// Turns raw keyboard state into fighter commands using a keymap from config.js.
export class KeyboardController {
  constructor(keyboard, keymap) {
    this.keyboard = keyboard;
    this.keymap = keymap;
  }

  getCommands() {
    const kb = this.keyboard;
    const m = this.keymap;
    return {
      left: kb.isDown(m.left),
      right: kb.isDown(m.right),
      crouch: kb.isDown(m.crouch),
      block: kb.isDown(m.block),
      jump: kb.wasPressed(m.jump),
      punch: kb.wasPressed(m.punch),
      kick: kb.wasPressed(m.kick),
      special: kb.wasPressed(m.special),
    };
  }
}
