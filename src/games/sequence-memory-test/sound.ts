import { getJSON, setJSON } from '../../lib/storage';

type AC = typeof AudioContext;

// One soft note per tile, picked from a pentatonic scale so any sequence sounds pleasant.
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];

/** Tiny synthesized sound kit: a note per tile, a level-up chirp and a fail "bwomp". */
export function createSound() {
  let ctx: AudioContext | null = null;
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
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function note(a: AudioContext, freq: number, at: number, length: number, volume: number, type: OscillatorType = 'sine'): void {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain).connect(a.destination);
    osc.start(at);
    osc.stop(at + length + 0.02);
  }

  function tile(index: number): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    note(a, NOTES[index], t, 0.35, 0.1);
    note(a, NOTES[index] * 2, t, 0.15, 0.02, 'triangle');
  }

  function levelUp(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + 0.02;
    note(a, 783.99, t, 0.18, 0.06, 'triangle');
    note(a, 1046.5, t + 0.08, 0.25, 0.06, 'triangle');
  }

  function fail(): void {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const filter = a.createBiquadFilter();
    const gain = a.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.4);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    osc.connect(filter).connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.47);
  }

  function setMuted(next: boolean): void {
    muted = next;
    setJSON('sound-muted', next);
  }

  return { tile, levelUp, fail, setMuted, isMuted: () => muted };
}
