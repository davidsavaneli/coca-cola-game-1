export type AudioAsset = {
  name: string;
  url: string;
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();

  constructor() {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      this.audioContext = new Ctx();
    } else {
      // Web Audio not supported
      this.audioContext = null;
    }
  }

  isSupported() {
    return this.audioContext != null;
  }

  async resume(): Promise<void> {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch {
        // ignore
      }
    }
  }

  async load(assets: AudioAsset[]): Promise<void> {
    if (!this.audioContext) return;
    await Promise.all(
      assets.map(async (asset) => {
        try {
          const res = await fetch(asset.url, { cache: "force-cache" });
          if (!res.ok) return;
          const arrayBuffer = await res.arrayBuffer();
          // decodeAudioData may return a promise or require callback; use promise form
          const buffer = await this.audioContext!.decodeAudioData(arrayBuffer.slice(0));
          this.buffers.set(asset.name, buffer);
        } catch {
          // ignore load/decode errors
        }
      })
    );
  }

  play(name: string, { allowOverlap = true }: { allowOverlap?: boolean } = {}): void {
    if (!this.audioContext) return;
    const buf = this.buffers.get(name);
    if (!buf) return;
    try {
      const src = this.audioContext.createBufferSource();
      src.buffer = buf;
      src.connect(this.audioContext.destination);
      src.start(0);
      if (!allowOverlap) {
        // No tracking required for single-fire; caller should throttle externally if needed
      }
    } catch {
      // ignore play errors
    }
  }
}

export const audioManager = new AudioManager();
