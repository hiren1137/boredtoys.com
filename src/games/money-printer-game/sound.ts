import { getJSON, setJSON } from '../../lib/storage';

type AC = typeof AudioContext;

/** Synthesized printer clunks, a new-note fanfare and an end-of-year chime. */
export function createSound() {
  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let muted = getJSON<boolean>('sound-muted', false);

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
      noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(a: AudioContext, f: number, at: number, len: number, vol: number, type: OscillatorType = 'triangle'): void {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(a.destination);
    o.start(at);
    o.stop(at + len + 0.02);
  }

  function print(): void {
    const a = audio();
    if (!a || !noise) return;
    const t = a.currentTime;
    const src = a.createBufferSource();
    src.buffer = noise;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 900 + Math.random() * 400;
    const g = a.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(f).connect(g).connect(a.destination);
    src.start(t);
    src.stop(t + 0.1);
    tone(a, 110, t, 0.08, 0.08, 'square');
  }

  function newNote(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.02;
    [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(a, f, t + i * 0.08, 0.3, 0.09));
  }

  function end(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.02;
    [523.25, 392, 329.63, 261.63].forEach((f, i) => tone(a, f, t + i * 0.14, 0.5, 0.08, 'sine'));
  }

  function setMuted(next: boolean): void {
    muted = next;
    setJSON('sound-muted', next);
  }

  return { print, newNote, end, setMuted, isMuted: () => muted };
}
