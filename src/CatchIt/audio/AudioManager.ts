export type AudioAsset = {
  name: string;
  url: string;
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loopSource: AudioBufferSourceNode | null = null;

  constructor() {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ctx: AudioContext = new Ctx();
      this.audioContext = ctx;
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(ctx.destination);
    } else {
      // Web Audio not supported
      this.audioContext = null;
      this.masterGain = null;
    }
  }

  isSupported() {
    return this.audioContext != null && this.masterGain != null;
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

  setMuted(muted: boolean) {
    if (!this.masterGain) return;
    this.masterGain.gain.value = muted ? 0 : 1;
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

  play(name: string): void {
    if (!this.audioContext || !this.masterGain) return;
    const buf = this.buffers.get(name);
    if (!buf) return;
    try {
      const src = this.audioContext.createBufferSource();
      src.buffer = buf;
      src.connect(this.masterGain);
      src.start(0);
    } catch {
      // ignore play errors
    }
  }

  startLoop(name: string): void {
    if (!this.audioContext || !this.masterGain) return;
    if (this.loopSource) return; // already playing
    const buf = this.buffers.get(name);
    if (!buf) return;
    try {
      const src = this.audioContext.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.masterGain);
      src.start(0);
      this.loopSource = src;
    } catch {
      // ignore
    }
  }

  stopLoop(): void {
    if (!this.loopSource) return;
    try {
      this.loopSource.stop(0);
    } catch {
      // ignore
    }
    this.loopSource.disconnect();
    this.loopSource = null;
  }
}

export const audioManager = new AudioManager();
