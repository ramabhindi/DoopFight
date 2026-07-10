// Looping background music with an autoplay fallback: browsers block audio
// until the user has interacted with the page, so if the initial play() is
// rejected we retry once on the first keydown/mousedown/click.
export class Music {
  constructor(src, volume = 0.5) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = volume;

    this.loaded = false;
    this.audio.addEventListener('canplaythrough', () => { this.loaded = true; }, { once: true });
  }

  play() {
    const result = this.audio.play();
    if (result && result.catch) {
      result.catch(() => {
        const retry = () => {
          this.audio.play().catch(() => {});
          window.removeEventListener('keydown', retry);
          window.removeEventListener('mousedown', retry);
        };
        window.addEventListener('keydown', retry, { once: true });
        window.addEventListener('mousedown', retry, { once: true });
      });
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // Jump back to the start and play, e.g. every time the title screen resets.
  restart() {
    this.audio.currentTime = 0;
    this.play();
  }
}
