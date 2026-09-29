/** 効果音はすべて Web Audio でその場で合成する(音声ファイル不要)。 */
export class Sound {
  private ctx: AudioContext | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('fukuwarai:muted') === '1';
    } catch {
      /* localStorage が使えなくても動く */
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem('fukuwarai:muted', m ? '1' : '0');
    } catch {
      /* noop */
    }
  }

  /** ユーザー操作の中で呼ぶ(iOS 対策) */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; to?: number; delay?: number } = {}) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    const peak = opts.gain ?? 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, opts: { gain?: number; from?: number; to?: number; delay?: number } = {}) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(opts.from ?? 1200, t0);
    if (opts.to) filter.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 0.25;
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t0);
  }

  /** パーツを選んだ */
  select() {
    this.tone(660, 0.09, { type: 'triangle', gain: 0.18 });
    this.tone(990, 0.12, { type: 'triangle', gain: 0.18, delay: 0.07 });
  }

  /** ぺたっ */
  paste() {
    this.tone(240, 0.16, { type: 'sine', to: 110, gain: 0.35 });
    this.noise(0.05, { from: 2200, gain: 0.12 });
    this.tone(520, 0.1, { type: 'triangle', to: 780, gain: 0.12, delay: 0.05 });
  }

  /** ぺりっ */
  peel() {
    this.noise(0.22, { from: 500, to: 3200, gain: 0.3 });
    this.tone(400, 0.14, { type: 'triangle', to: 700, gain: 0.1, delay: 0.1 });
  }

  /** やめる */
  cancel() {
    this.tone(520, 0.12, { type: 'triangle', to: 300, gain: 0.18 });
  }

  tab() {
    this.tone(880, 0.05, { type: 'square', gain: 0.05 });
  }

  /** できた！ */
  done() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.28, { type: 'triangle', gain: 0.22, delay: i * 0.11 }));
    this.noise(0.5, { from: 3000, to: 1500, gain: 0.08, delay: 0.35 });
  }
}
