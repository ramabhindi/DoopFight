// Tracks raw keyboard state. Controllers read from this each frame.
export class Keyboard {
  constructor() {
    this.down = new Set();     // keys currently held
    this.pressed = new Set();  // keys that went down since last frame

    window.addEventListener('keydown', (e) => {
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      // Stop arrows / space from scrolling the page
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  isDown(code) { return this.down.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  anyPressed() { return this.pressed.size > 0; }

  // Call once at the end of every frame.
  endFrame() { this.pressed.clear(); }
}
