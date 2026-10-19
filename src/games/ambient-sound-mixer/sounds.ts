import { Engine, Rack, every, poisson, drift, rand, pick, type Voice } from './engine';

export interface SoundDef {
  /** Short key used in the share link, e.g. #rain=60,fire=40 */
  key: string;
  name: string;
  color: string;
  build: (e: Engine, out: AudioNode) => Voice;
}

function rain(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const bed = r.node(e.gain(0.75));
  r.chain(r.src(e.loop('pink')), e.filter('highpass', 350), e.filter('lowpass', 5200), bed, out);
  r.chain(r.src(e.loop('white')), e.filter('bandpass', 2600, 0.6), e.filter('lowpass', 7000), e.gain(0.08), out);
  const wander = drift(e, bed.gain, 0.6, 0.9, 1.5, 4);
  const drops = every(e, poisson(28), (t) => {
    const dur = rand(0.012, 0.035);
    const src = e.grain('white', t, dur);
    const bp = e.filter('bandpass', rand(1800, 5200), rand(1.5, 3));
    const g = e.env(t, rand(0.12, 0.45), 0.001, dur);
    const p = e.pan(rand(-0.85, 0.85));
    src.connect(bp).connect(g).connect(p).connect(out);
    e.cleanup([src, bp, g, p], t + dur + 0.05);
  });
  return {
    tick: (u) => {
      wander(u);
      drops(u);
    },
    stop: (t) => r.stop(t),
  };
}

function thunder(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  r.chain(r.src(e.loop('brown')), e.filter('lowpass', 160), e.gain(0.22), out);
  const strike = (t: number) => {
    const len = rand(6, 10);
    const src = e.grain('brown', t, len);
    const hp = e.filter('highpass', 28);
    const lp = e.filter('lowpass', rand(700, 1100), 0.5);
    lp.frequency.setTargetAtTime(110, t + 0.6, len / 4);
    const g = e.ctx.createGain();
    const peak = rand(0.7, 1.2);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + rand(0.25, 0.7));
    let k = t + 1;
    const rolls = Math.floor(rand(2, 5));
    for (let i = 0; i < rolls; i++) {
      g.gain.setTargetAtTime(peak * rand(0.35, 0.9), k, 0.25);
      k += rand(0.5, 1.2);
    }
    g.gain.setTargetAtTime(0, k, len / 6);
    const p = e.pan(rand(-0.5, 0.5));
    src.connect(hp).connect(lp).connect(g).connect(p).connect(out);
    e.cleanup([src, hp, lp, g, p], t + len + 0.2);
  };
  const strikes = every(e, () => rand(11, 26), strike, rand(1, 2.5));
  return { tick: strikes, stop: (t) => r.stop(t) };
}

function wind(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const ticks: ((u: number) => void)[] = [];
  for (const side of [-0.6, 0.6]) {
    const bp = e.filter('bandpass', 600, 1.1);
    const g = e.gain(0.5);
    r.chain(r.src(e.loop('pink')), bp, g, e.pan(side), out);
    ticks.push(drift(e, bp.frequency, 320, 1000, 1.5, 4), drift(e, g.gain, 0.25, 0.85, 1.2, 3.5));
  }
  const low = e.gain(0.35);
  r.chain(r.src(e.loop('brown')), e.filter('lowpass', 320), low, out);
  ticks.push(drift(e, low.gain, 0.2, 0.55, 2, 5));
  const whistle = e.filter('bandpass', 1100, 9);
  const wg = e.gain(0.05);
  r.chain(r.src(e.loop('white')), whistle, wg, out);
  ticks.push(drift(e, whistle.frequency, 800, 1500, 2, 5), drift(e, wg.gain, 0.01, 0.07, 2, 5));
  return { tick: (u) => ticks.forEach((f) => f(u)), stop: (t) => r.stop(t) };
}

function waves(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const lp = e.filter('lowpass', 400, 0.6);
  const body = e.gain(0.2);
  r.chain(r.src(e.loop('brown')), lp, body, out);
  const foam = e.gain(0.03);
  r.chain(r.src(e.loop('pink')), e.filter('highpass', 700), e.filter('lowpass', 6500), foam, out);
  const wave = (t: number, period: number) => {
    const crash = t + period * rand(0.38, 0.5);
    body.gain.setTargetAtTime(rand(0.75, 1.1), t, period * 0.14);
    lp.frequency.setTargetAtTime(rand(1300, 2000), t, period * 0.16);
    body.gain.setTargetAtTime(0.18, crash, period * 0.18);
    lp.frequency.setTargetAtTime(380, crash, period * 0.2);
    foam.gain.setTargetAtTime(rand(0.28, 0.42), crash - 0.3, 0.25);
    foam.gain.setTargetAtTime(0.025, crash + 0.5, period * 0.16);
  };
  let period = rand(7, 11);
  const cycle = every(
    e,
    () => period,
    (t) => {
      period = rand(7, 11.5);
      wave(t, period);
    },
    0.1,
  );
  return { tick: cycle, stop: (t) => r.stop(t) };
}

function fire(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const roar = e.gain(0.4);
  r.chain(r.src(e.loop('brown')), e.filter('lowpass', 260), roar, out);
  const hiss = e.gain(0.03);
  r.chain(r.src(e.loop('white')), e.filter('bandpass', 3200, 0.8), hiss, out);
  const crackle = (t: number, big: boolean) => {
    const dur = big ? rand(0.02, 0.05) : rand(0.002, 0.012);
    const src = e.grain('white', t, dur);
    const f = big ? e.filter('bandpass', rand(700, 1600), 1.2) : e.filter('highpass', rand(1500, 3500));
    const g = e.env(t, big ? rand(0.25, 0.5) : rand(0.08, 0.4), 0.0005, dur);
    const p = e.pan(rand(-0.6, 0.6));
    src.connect(f).connect(g).connect(p).connect(out);
    e.cleanup([src, f, g, p], t + dur + 0.05);
  };
  const pops = every(e, poisson(7), (t) => {
    if (Math.random() < 0.18) {
      const n = Math.floor(rand(3, 9));
      for (let i = 0; i < n; i++) crackle(t + rand(0, 0.15), false);
    } else crackle(t, Math.random() < 0.12);
  });
  const w1 = drift(e, roar.gain, 0.28, 0.5, 0.6, 2);
  const w2 = drift(e, hiss.gain, 0.015, 0.045, 0.8, 2.5);
  return {
    tick: (u) => {
      pops(u);
      w1(u);
      w2(u);
    },
    stop: (t) => r.stop(t),
  };
}

function stream(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  r.chain(r.src(e.loop('white')), e.filter('highpass', 300), e.filter('lowpass', 3200), e.gain(0.2), out);
  const ticks: ((u: number) => void)[] = [];
  for (let i = 0; i < 3; i++) {
    const bp = e.filter('bandpass', rand(500, 2000), 5);
    r.chain(r.src(e.loop('pink')), bp, e.gain(0.8), e.pan((i - 1) * 0.6), out);
    ticks.push(drift(e, bp.frequency, 420, 2400, 0.08, 0.25));
  }
  ticks.push(
    every(e, poisson(9), (t) => {
      const f0 = rand(320, 1300);
      const dur = rand(0.04, 0.09);
      const o = e.osc('sine', f0, t);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * rand(1.8, 2.6), t + dur);
      o.stop(t + dur + 0.02);
      const g = e.env(t, rand(0.025, 0.09), 0.002, dur);
      const p = e.pan(rand(-0.8, 0.8));
      o.connect(g).connect(p).connect(out);
      e.cleanup([o, g, p], t + dur + 0.05);
    }),
  );
  return { tick: (u) => ticks.forEach((f) => f(u)), stop: (t) => r.stop(t) };
}

function note(e: Engine, out: AudioNode, t: number, dur: number, f0: number, f1: number, amp: number): void {
  const o = e.osc('sine', f0, t);
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o.stop(t + dur + 0.03);
  const g = e.ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(amp, t + Math.min(0.012, dur / 3));
  g.gain.setTargetAtTime(0, t + dur * 0.7, dur * 0.12);
  o.connect(g).connect(out);
  e.cleanup([o, g], t + dur + 0.05);
}

function birds(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const soft = r.node(e.filter('lowpass', 7500));
  soft.connect(out);
  const perches = [-0.7, -0.2, 0.35, 0.8].map((p) => {
    const n = r.node(e.pan(p));
    n.connect(soft);
    return n;
  });
  const song = (t: number) => {
    const at = pick(perches);
    const loud = rand(0.1, 0.22);
    const kind = Math.floor(rand(0, 3));
    if (kind === 0) {
      const base = rand(3000, 4600);
      const n = Math.floor(rand(3, 7));
      for (let i = 0; i < n; i++) note(e, at, t + i * rand(0.11, 0.17), rand(0.05, 0.09), base, base * 0.7, loud);
    } else if (kind === 1) {
      const hi = rand(3400, 4200);
      note(e, at, t, 0.32, hi, hi * 0.95, loud);
      note(e, at, t + 0.45, 0.4, hi * 0.82, hi * 0.78, loud * 0.9);
    } else {
      const base = rand(4200, 5600);
      const n = Math.floor(rand(10, 18));
      for (let i = 0; i < n; i++) note(e, at, t + i * 0.045, 0.03, base * 1.05, base * 0.95, loud * 0.7);
    }
  };
  return { tick: every(e, () => rand(1.2, 4.5), song, 0.3), stop: (t) => r.stop(t) };
}

function crickets(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  r.chain(r.src(e.loop('pink')), e.filter('lowpass', 600), e.gain(0.05), out);
  const ticks = [4300, 4700, 5100].map((freq, i) => {
    const g = e.gain(0);
    r.chain(r.src(e.osc('sine', freq)), g, e.pan((i - 1) * 0.75), out);
    const amp = rand(0.05, 0.085);
    return every(
      e,
      () => rand(0.55, 0.95),
      (t) => {
        for (let k = 0; k < 3; k++) {
          const s = t + k * 0.032;
          g.gain.setValueAtTime(0, s);
          g.gain.linearRampToValueAtTime(amp, s + 0.004);
          g.gain.setValueAtTime(amp, s + 0.016);
          g.gain.linearRampToValueAtTime(0, s + 0.022);
        }
      },
      rand(0.05, 0.6),
    );
  });
  return { tick: (u) => ticks.forEach((f) => f(u)), stop: (t) => r.stop(t) };
}

function fan(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  r.chain(r.src(e.loop('brown')), e.filter('lowpass', 520), e.gain(0.55), out);
  const flutter = e.gain(1);
  r.chain(r.src(e.loop('pink')), e.filter('bandpass', 1100, 0.6), flutter, e.gain(0.09), out);
  const lfo = r.src(e.osc('sine', 13));
  r.chain(lfo, e.gain(0.18)).connect(flutter.gain);
  r.chain(r.src(e.osc('sine', 120)), e.gain(0.02), out);
  r.chain(r.src(e.osc('sine', 240)), e.gain(0.006), out);
  return { stop: (t) => r.stop(t) };
}

function plainNoise(kind: 'white' | 'pink' | 'brown') {
  return (e: Engine, out: AudioNode): Voice => {
    const r = new Rack(e);
    if (kind === 'white') r.chain(r.src(e.loop('white')), e.filter('lowpass', 9000), e.gain(0.38), out);
    else if (kind === 'pink') r.chain(r.src(e.loop('pink')), e.gain(0.5), out);
    else r.chain(r.src(e.loop('brown')), e.filter('highpass', 25), e.gain(0.75), out);
    return { stop: (t) => r.stop(t) };
  };
}

function traffic(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  r.chain(r.src(e.loop('brown')), e.filter('lowpass', 380), e.gain(0.35), out);
  r.chain(r.src(e.loop('pink')), e.filter('lowpass', 1200), e.gain(0.05), out);
  const car = (t: number) => {
    const len = rand(3, 6);
    const mid = t + len / 2;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const src = e.grain('pink', t, len);
    const bp = e.filter('bandpass', 300, 0.7);
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.linearRampToValueAtTime(rand(650, 900), mid);
    bp.frequency.linearRampToValueAtTime(260, t + len);
    const g = e.ctx.createGain();
    const peak = rand(0.35, 0.7);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, mid);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    const p = typeof e.ctx.createStereoPanner === 'function' ? e.ctx.createStereoPanner() : null;
    const engineTone = e.osc('sawtooth', rand(70, 95), t);
    engineTone.frequency.setValueAtTime(engineTone.frequency.value * 1.06, t);
    engineTone.frequency.linearRampToValueAtTime(engineTone.frequency.value * 0.94, t + len);
    engineTone.stop(t + len + 0.05);
    const tl = e.filter('lowpass', 220);
    const tg = e.gain(0.12);
    const join = p ?? e.gain(1);
    if (p) {
      p.pan.setValueAtTime(-0.9 * dir, t);
      p.pan.linearRampToValueAtTime(0.9 * dir, t + len);
    }
    src.connect(bp).connect(g);
    engineTone.connect(tl).connect(tg).connect(g);
    g.connect(join).connect(out);
    e.cleanup([src, bp, g, join, engineTone, tl, tg], t + len + 0.2);
  };
  return { tick: every(e, () => rand(2, 6), car, 0.5), stop: (t) => r.stop(t) };
}

function clock(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  let tock = false;
  const tick = (t: number) => {
    const freq = tock ? 2300 : 3100;
    tock = !tock;
    const src = e.grain('white', t, 0.03);
    const bp = e.filter('bandpass', freq, 7);
    const g = e.env(t, 2, 0.0008, 0.028);
    const body = e.osc('sine', tock ? 1250 : 980, t);
    body.stop(t + 0.08);
    const bg = e.env(t, 0.12, 0.001, 0.05);
    src.connect(bp).connect(g).connect(out);
    body.connect(bg).connect(out);
    e.cleanup([src, bp, g, body, bg], t + 0.1);
  };
  return { tick: every(e, () => 1, tick, 0.1), stop: (t) => r.stop(t) };
}

function purr(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const am = e.gain(0.5);
  const breath = e.gain(0.6);
  r.chain(r.src(e.loop('brown')), e.filter('lowpass', 320), am);
  const rumble = r.src(e.osc('sawtooth', 26));
  r.chain(rumble, e.filter('lowpass', 160), e.gain(0.16), am);
  const pulse = r.src(e.osc('sine', 26));
  r.chain(pulse, e.gain(0.5)).connect(am.gain);
  r.chain(am, breath, e.filter('highpass', 30), out);
  const cycle = every(
    e,
    () => rand(2.2, 2.9),
    (t) => {
      const exhale = rand(1.1, 1.4);
      breath.gain.setTargetAtTime(0.95, t, 0.08);
      pulse.frequency.setTargetAtTime(27, t, 0.1);
      rumble.frequency.setTargetAtTime(27, t, 0.1);
      breath.gain.setTargetAtTime(0.25, t + exhale, 0.05);
      breath.gain.setTargetAtTime(0.6, t + exhale + 0.2, 0.12);
      pulse.frequency.setTargetAtTime(23, t + exhale + 0.2, 0.1);
      rumble.frequency.setTargetAtTime(23, t + exhale + 0.2, 0.1);
    },
    0.05,
  );
  return { tick: cycle, stop: (t) => r.stop(t) };
}

const CHIME_NOTES = [1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];

function chimes(e: Engine, out: AudioNode): Voice {
  const r = new Rack(e);
  const bell = (t: number) => {
    const f = pick(CHIME_NOTES);
    const p = e.pan(rand(-0.7, 0.7));
    p.connect(out);
    const nodes: AudioNode[] = [p];
    const decay = rand(2.2, 3.6);
    for (const [ratio, amp, len] of [
      [1, 0.12, decay],
      [2.76, 0.04, decay * 0.45],
      [5.4, 0.016, decay * 0.2],
    ] as const) {
      const o = e.osc('sine', f * ratio, t);
      o.stop(t + len + 0.1);
      const g = e.env(t, amp, 0.004, len);
      o.connect(g).connect(p);
      nodes.push(o, g);
    }
    e.cleanup(nodes, t + decay + 0.2);
  };
  const ring = every(
    e,
    () => rand(0.5, 2.8),
    (t) => {
      const n = Math.random() < 0.3 ? Math.floor(rand(2, 5)) : 1;
      for (let i = 0; i < n; i++) bell(t + i * rand(0.09, 0.22));
    },
    0.2,
  );
  return { tick: ring, stop: (t) => r.stop(t) };
}

export const SOUNDS: readonly SoundDef[] = [
  { key: 'rain', name: 'Rain', color: '#6cc8ff', build: rain },
  { key: 'thunder', name: 'Thunder', color: '#c7a3ff', build: thunder },
  { key: 'wind', name: 'Wind', color: '#b8f0d8', build: wind },
  { key: 'waves', name: 'Ocean Waves', color: '#6cc8ff', build: waves },
  { key: 'fire', name: 'Campfire', color: '#ffac57', build: fire },
  { key: 'stream', name: 'Stream', color: '#6be3a8', build: stream },
  { key: 'birds', name: 'Birds', color: '#ffd447', build: birds },
  { key: 'crickets', name: 'Crickets', color: '#6be3a8', build: crickets },
  { key: 'fan', name: 'Fan', color: '#dcd8e4', build: fan },
  { key: 'white', name: 'White Noise', color: '#ffffff', build: plainNoise('white') },
  { key: 'pink', name: 'Pink Noise', color: '#ffa3d1', build: plainNoise('pink') },
  { key: 'brown', name: 'Brown Noise', color: '#e0b48a', build: plainNoise('brown') },
  { key: 'traffic', name: 'City Traffic', color: '#ff7466', build: traffic },
  { key: 'clock', name: 'Clock', color: '#ffd447', build: clock },
  { key: 'purr', name: 'Cat Purr', color: '#ffa3d1', build: purr },
  { key: 'chimes', name: 'Wind Chimes', color: '#c7a3ff', build: chimes },
];
