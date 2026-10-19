import { getJSON, setJSON } from '../../lib/storage';

type AC = typeof AudioContext;

/** Synthesized shop sounds: door bell, offer blip, cash register and a grumpy exit. */
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

  function tone(a: AudioContext, f: number, at: number, len: number, vol: number, type: OscillatorType = 'sine', to?: number): void {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + len);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(a.destination);
    o.start(at);
    o.stop(at + len + 0.02);
  }

  const play = (fn: (a: AudioContext, t: number) => void) => () => {
    const a = audio();
    if (a) fn(a, a.currentTime + 0.01);
  };

  return {
    bell: play((a, t) => {
      tone(a, 1568, t, 0.5, 0.06);
      tone(a, 1975.5, t + 0.12, 0.6, 0.05);
    }),
    blip: play((a, t) => tone(a, 440, t, 0.12, 0.07, 'triangle', 660)),
    sale: play((a, t) => {
      tone(a, 1046.5, t, 0.12, 0.08, 'square');
      tone(a, 1318.5, t + 0.08, 0.4, 0.08, 'triangle');
      tone(a, 2093, t + 0.16, 0.5, 0.04, 'sine');
    }),
    huff: play((a, t) => tone(a, 260, t, 0.4, 0.09, 'sawtooth', 90)),
    setMuted(next: boolean) {
      muted = next;
      setJSON('sound-muted', next);
    },
    isMuted: () => muted,
  };
}
