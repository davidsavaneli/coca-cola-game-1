import catchSoundSrc from "./assets/sounds/catch_sound.mp3";
import gameOverSoundSrc from "./assets/sounds/game_over.mp3";
import themeSoundSrc from "./assets/sounds/game_theme_sound.mp3";

export class SoundManager {
  private muted = false;
  private catchAudio?: HTMLAudioElement;
  private gameOverAudio?: HTMLAudioElement;
  private themeAudio?: HTMLAudioElement;
  private unlocked = false;

  constructor() {
    // create elements but don't play yet
    this.catchAudio = new Audio(catchSoundSrc);
    this.gameOverAudio = new Audio(gameOverSoundSrc);
    this.themeAudio = new Audio(themeSoundSrc);
    if (this.themeAudio) {
      this.themeAudio.loop = true;
      this.themeAudio.volume = 0.6;
    }
    // hint the browser to prefetch buffers when possible
    if (this.catchAudio) this.catchAudio.preload = "auto";
    if (this.gameOverAudio) this.gameOverAudio.preload = "auto";
    if (this.themeAudio) this.themeAudio.preload = "auto";
  }

  // Warmup audio without playing (safe to call without user gesture)
  async warmup(): Promise<void> {
    const ensureLoaded = (el?: HTMLAudioElement): Promise<void> =>
      new Promise((resolve) => {
        if (!el) return resolve();
        const done = () => resolve();
        const timeout = setTimeout(done, 1200);
        const onReady = () => {
          clearTimeout(timeout);
          resolve();
        };
        try {
          el.preload = "auto";
          el.load();
          el.addEventListener("canplaythrough", onReady, { once: true });
        } catch {
          clearTimeout(timeout);
          resolve();
        }
      });

    // Fetch the resources to fill HTTP cache (best-effort)
    const cacheFetch = (url: string) =>
      fetch(url, { cache: "force-cache" }).then(() => void 0).catch(() => void 0);

    await Promise.all([
      ensureLoaded(this.catchAudio),
      ensureLoaded(this.gameOverAudio),
      ensureLoaded(this.themeAudio),
      cacheFetch(catchSoundSrc),
      cacheFetch(gameOverSoundSrc),
      cacheFetch(themeSoundSrc),
    ]);
  }

  // Must be called from a user gesture to allow audio playback on iOS/Safari
  async preload(): Promise<void> {
    try {
      const tasks: Array<Promise<void>> = [];
      if (this.catchAudio) {
        tasks.push(
          this.catchAudio
            .play()
            .then(() => {
              if (this.catchAudio) {
                this.catchAudio.pause();
                this.catchAudio.currentTime = 0;
              }
            })
            .catch(() => void 0)
        );
      }
      if (this.gameOverAudio) {
        tasks.push(
          this.gameOverAudio
            .play()
            .then(() => {
              if (this.gameOverAudio) {
                this.gameOverAudio.pause();
                this.gameOverAudio.currentTime = 0;
              }
            })
            .catch(() => void 0)
        );
      }
      if (this.themeAudio) {
        tasks.push(
          this.themeAudio
            .play()
            .then(() => {
              if (this.themeAudio) {
                this.themeAudio.pause();
                this.themeAudio.currentTime = 0;
              }
            })
            .catch(() => void 0)
        );
      }
      await Promise.all(tasks);
      this.unlocked = true;
    } catch {
      // ignore
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    const vol = muted ? 0 : 1;
    if (this.catchAudio) this.catchAudio.volume = 1 * vol;
    if (this.gameOverAudio) this.gameOverAudio.volume = 1 * vol;
    if (this.themeAudio) this.themeAudio.volume = 0.6 * vol;
    if (muted && this.themeAudio) this.themeAudio.pause();
  }

  isMuted() {
    return this.muted;
  }

  playCatch() {
    if (this.muted || !this.unlocked) return;
    try {
      const base = this.catchAudio;
      if (!base) return;
      const a = base.cloneNode(true) as HTMLAudioElement;
      void a.play().catch(() => void 0);
    } catch {
      // ignore
    }
  }

  playGameOver() {
    if (this.muted || !this.unlocked) return;
    try {
      if (this.gameOverAudio) {
        this.gameOverAudio.currentTime = 0;
        void this.gameOverAudio.play().catch(() => void 0);
      }
    } catch {
      // ignore
    }
  }

  playTheme() {
    if (this.muted || !this.unlocked) return;
    try {
      if (this.themeAudio) {
        this.themeAudio.currentTime = 0;
        void this.themeAudio.play().catch(() => void 0);
      }
    } catch {
      // ignore
    }
  }

  stopTheme() {
    try {
      if (this.themeAudio) this.themeAudio.pause();
    } catch {
      // ignore
    }
  }
}
