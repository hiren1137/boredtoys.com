import { getJSON, setJSON } from '../../lib/storage';

type AC = typeof AudioContext;

/** Synthesized sound kit: click blips, purchase chimes, a looping beat and a calm ending chord. */
export function createSound() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = getJSON<boolean>('sound-muted', false);
  let beatOn = false;
  let beatLevel = 1;
  let step = 0;
  let nextAt = 0;
  let timer = 0;

  function audio(): AudioContext | null {
    if (muted) return null;
    if (!ctx) {
      const Ctor: AC | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended' && !document.hidden) void ctx.resume();
    return ctx;
  }

  function tone(a: AudioContext, freq: number, at: number, len: number, vol: number, type: OscillatorType = 'sine', slideTo?: number): void {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + len);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
    osc.connect(gain).connect(master!);
    osc.start(at);
    osc.stop(at + len + 0.03);
  }

  function hiss(a: AudioContext, at: number, len: number, vol: number, freq: number, type: BiquadFilterType): void {
    if (!noise) return;
    const src = a.createBufferSource();
    src.buffer = noise;
    const filter = a.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = a.createGain();
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
    src.connect(filter).connect(gain).connect(master!);
    src.start(at);
    src.stop(at + len + 0.02);
  }

  let lastClick = 0;
  function click(combo: number): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    if (t - lastClick < 0.03) return;
    lastClick = t;
    const f = 520 + Math.min(combo, 30) * 14 + Math.random() * 30;
    tone(a, f, t, 0.07, 0.07, 'square', f * 1.5);
  }

  function buy(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.01;
    [659.25, 830.61, 987.77].forEach((f, i) => tone(a, f, t + i * 0.07, 0.25, 0.09, 'triangle'));
  }

  function ping(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    tone(a, 1318.5, t, 0.12, 0.06, 'sine');
    tone(a, 1760, t + 0.08, 0.16, 0.05, 'sine');
  }

  let lastBounce = 0;
  function bounce(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    if (t - lastBounce < 0.08) return;
    lastBounce = t;
    tone(a, 300 + Math.random() * 200, t, 0.06, 0.035, 'sine', 160);
  }

  function jackpot(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.01;
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => tone(a, f, t + i * 0.06, 0.3, 0.08, 'square'));
  }

  function whack(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    hiss(a, t, 0.12, 0.25, 1200, 'bandpass');
    tone(a, 180, t, 0.15, 0.12, 'sine', 70);
  }

  // ---- Beat loop: a 16-step pattern scheduled slightly ahead of time. ----
  const KICK = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0];
  const SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];
  const BASS = [55, 0, 0, 55, 0, 0, 65.41, 0, 49, 0, 0, 49, 0, 0, 73.42, 0];
  const CHORDS = [
    [261.63, 329.63, 392],
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
    [196, 246.94, 293.66],
  ];
  let bar = 0;

  function scheduleStep(a: AudioContext, at: number): void {
    if (KICK[step]) tone(a, 140, at, 0.22, 0.28, 'sine', 45);
    if (SNARE[step]) hiss(a, at, 0.14, 0.12, 1800, 'bandpass');
    if (step % 2 === 1) hiss(a, at, 0.04, 0.05, 7000, 'highpass');
    if (step === 0) {
      for (const f of CHORDS[bar % 4]) tone(a, f, at, 1.2, 0.022, 'triangle');
    }
    if (beatLevel > 1 && BASS[step]) tone(a, BASS[step] * 2, at, 0.18, 0.11, 'sawtooth');
  }

  function scheduler(): void {
    const a = ctx;
    if (!a || muted || !beatOn || document.hidden) return;
    const stepLen = 60 / (beatLevel > 1 ? 112 : 92) / 4;
    if (nextAt < a.currentTime) nextAt = a.currentTime + 0.05;
    while (nextAt < a.currentTime + 0.12) {
      scheduleStep(a, nextAt);
      nextAt += stepLen;
      step = (step + 1) % 16;
      if (step === 0) bar++;
    }
  }

  function startBeat(level: number): void {
    beatLevel = level;
    beatOn = true;
    if (!audio()) return;
    if (!timer) timer = window.setInterval(scheduler, 40);
  }

  function stopBeat(): void {
    beatOn = false;
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  function peace(): void {
    stopBeat();
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.05;
    [196, 293.66, 392, 493.88, 587.33].forEach((f, i) => {
      const osc = a.createOscillator();
      const gain = a.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.05, t + i * 0.25 + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 5);
      osc.connect(gain).connect(master!);
      osc.start(t + i * 0.25);
      osc.stop(t + i * 0.25 + 5.1);
    });
  }

  function setMuted(next: boolean): void {
    muted = next;
    setJSON('sound-muted', next);
    if (next && ctx) void ctx.suspend();
    if (!next) {
      audio();
      if (beatOn && !timer) timer = window.setInterval(scheduler, 40);
    }
  }

  function setHidden(hidden: boolean): void {
    if (!ctx) return;
    if (hidden) void ctx.suspend();
    else if (!muted) void ctx.resume();
  }

  return { click, buy, ping, bounce, jackpot, whack, startBeat, stopBeat, peace, setMuted, setHidden, isMuted: () => muted };
}
