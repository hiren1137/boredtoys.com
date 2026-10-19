type AC = typeof AudioContext;
export type NoiseKind = 'white' | 'pink' | 'brown';

/** A running sound. `tick` schedules upcoming events (drops, chirps, waves) up to `until`. */
export interface Voice {
  tick?: (until: number) => void;
  stop: (at: number) => void;
}

const NOISE_SECONDS = 5;
const CROSSFADE = 0.25;
const TARGET_RMS = 0.2;

/** Seamless looping stereo noise: the tail is blended into the head so the loop point never clicks. */
function makeNoise(ctx: AudioContext, kind: NoiseKind): AudioBuffer {
  const rate = ctx.sampleRate;
  const n = Math.floor(rate * NOISE_SECONDS);
  const f = Math.floor(rate * CROSSFADE);
  const buf = ctx.createBuffer(2, n, rate);
  for (let ch = 0; ch < 2; ch++) {
    const a = new Float32Array(n + f);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let last = 0;
    for (let i = 0; i < a.length; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') a[i] = w;
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        a[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        a[i] = last;
      }
    }
    for (let i = 0; i < f; i++) {
      const k = i / f;
      a[i] = a[i] * k + a[n + i] * (1 - k);
    }
    let sum = 0;
    let mean = 0;
    for (let i = 0; i < n; i++) mean += a[i];
    mean /= n;
    for (let i = 0; i < n; i++) {
      a[i] -= mean;
      sum += a[i] * a[i];
    }
    const scale = TARGET_RMS / Math.sqrt(sum / n || 1);
    const out = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, a[i] * scale));
  }
  return buf;
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Owns the AudioContext and the master chain:
 * sounds -> bus -> master gain -> gentle compressor -> safety limiter -> speakers.
 */
export class Engine {
  readonly ctx: AudioContext;
  readonly bus: GainNode;
  readonly master: GainNode;
  private noises: Partial<Record<NoiseKind, AudioBuffer>> = {};

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.bus = ctx.createGain();
    this.master = ctx.createGain();
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -20;
    glue.knee.value = 12;
    glue.ratio.value = 3;
    glue.attack.value = 0.02;
    glue.release.value = 0.4;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.2;
    this.bus.connect(this.master).connect(glue).connect(limiter).connect(ctx.destination);
  }

  static create(): Engine | null {
    const Ctor: AC | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      return new Engine(new Ctor({ latencyHint: 'playback' }));
    } catch {
      try {
        return new Engine(new Ctor());
      } catch {
        return null;
      }
    }
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  buffer(kind: NoiseKind): AudioBuffer {
    return (this.noises[kind] ??= makeNoise(this.ctx, kind));
  }

  /** Looping noise that starts at a random spot so stacked layers never line up. */
  loop(kind: NoiseKind, at = this.now): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = this.buffer(kind);
    s.loop = true;
    s.start(at, rand(0, NOISE_SECONDS - 0.1));
    return s;
  }

  /** A short one-shot slice of noise, used for grains like raindrops and crackles. */
  grain(kind: NoiseKind, at: number, dur: number): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = this.buffer(kind);
    if (dur > NOISE_SECONDS - 0.5) {
      s.loop = true;
      s.start(at, rand(0, NOISE_SECONDS - 0.1));
      s.stop(at + dur + 0.02);
    } else {
      s.start(at, rand(0, NOISE_SECONDS - dur - 0.1), dur + 0.02);
    }
    return s;
  }

  filter(type: BiquadFilterType, freq: number, q = 0.707): BiquadFilterNode {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  gain(v: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }

  pan(p: number): AudioNode {
    if (typeof this.ctx.createStereoPanner !== 'function') return this.gain(1);
    const n = this.ctx.createStereoPanner();
    n.pan.value = Math.max(-1, Math.min(1, p));
    return n;
  }

  osc(type: OscillatorType, freq: number, at = this.now): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.start(at);
    return o;
  }

  /** Percussive envelope on a fresh gain node: fast attack, exponential decay. */
  env(at: number, peak: number, attack: number, decay: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    return g;
  }

  /** Disconnect nodes once a one-shot has finished so the graph stays small. */
  cleanup(nodes: AudioNode[], at: number): void {
    const ms = Math.max(0, (at - this.now) * 1000) + 200;
    window.setTimeout(() => {
      for (const n of nodes) {
        try {
          n.disconnect();
        } catch {
          /* already gone */
        }
      }
    }, ms);
  }
}

/** Tracks long-running nodes of one voice so stopping is a single call. */
export class Rack {
  private sources: AudioScheduledSourceNode[] = [];
  private nodes: AudioNode[] = [];
  constructor(private e: Engine) {}

  src<T extends AudioScheduledSourceNode>(s: T): T {
    this.sources.push(s);
    this.nodes.push(s);
    return s;
  }

  node<T extends AudioNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }

  /** Connects a chain left to right and remembers every node in it. */
  chain(...ns: AudioNode[]): AudioNode {
    for (let i = 0; i < ns.length; i++) {
      if (!this.nodes.includes(ns[i])) this.nodes.push(ns[i]);
      if (i > 0) ns[i - 1].connect(ns[i]);
    }
    return ns[ns.length - 1];
  }

  stop(at: number): void {
    for (const s of this.sources) {
      try {
        s.stop(at);
      } catch {
        /* never started or already stopped */
      }
    }
    this.e.cleanup(this.nodes, at);
  }
}

/** Calls `fire(t)` at random intervals from `gap()` until `until`, remembering where it left off. */
export function every(e: Engine, gap: () => number, fire: (t: number) => void, firstDelay = 0.05) {
  let next = e.now + firstDelay;
  return (until: number) => {
    if (next < e.now) next = e.now + 0.02;
    while (next < until) {
      fire(next);
      next += Math.max(0.005, gap());
    }
  };
}

/** Poisson-style gaps for an average of `perSecond` events. */
export const poisson = (perSecond: number) => () => -Math.log(1 - Math.random()) / perSecond;

/** Smoothly drifts an AudioParam to new random targets, like wind or breathing. */
export function drift(e: Engine, param: AudioParam, lo: number, hi: number, minGap: number, maxGap: number) {
  return every(
    e,
    () => rand(minGap, maxGap),
    (t) => param.setTargetAtTime(rand(lo, hi), t, rand(minGap, maxGap) / 3),
    0,
  );
}
