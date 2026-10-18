import { getJSON, setJSON } from '../../lib/storage';

type AC = typeof AudioContext;

/** Tiny synthesized sound kit: a drawing tone that follows roundness, a finish chime and a fail "bwomp". */
export function createSound() {
  let ctx: AudioContext | null = null;
  let muted = getJSON<boolean>('sound-muted', false);
  let tone: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode } | null = null;

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

  function startTone(): void {
    stopTone(0);
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const gain = a.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.06);
    const filter = a.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    const osc = a.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 330;
    const sub = a.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 165;
    const subGain = a.createGain();
    subGain.gain.value = 0.5;
    osc.connect(filter);
    sub.connect(subGain).connect(filter);
    filter.connect(gain).connect(a.destination);
    osc.start(t);
    sub.start(t);
    tone = { osc, sub, gain };
  }

  /** Higher roundness, higher pitch: about 196 Hz at 40% up to 784 Hz at 100%. */
  function updateTone(score: number): void {
    if (!tone || !ctx) return;
    const k = Math.max(0, Math.min(1, (score - 40) / 60));
    const freq = 196 * 2 ** (k * 2);
    const t = ctx.currentTime;
    tone.osc.frequency.setTargetAtTime(freq, t, 0.05);
    tone.sub.frequency.setTargetAtTime(freq / 2, t, 0.05);
  }

  function stopTone(fade = 0.08): void {
    if (!tone || !ctx) {
      tone = null;
      return;
    }
    const { osc, sub, gain } = tone;
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + fade);
    osc.stop(t + fade + 0.02);
    sub.stop(t + fade + 0.02);
    tone = null;
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

  /** Better circles get a longer, brighter arpeggio. */
  function chime(score: number, isNewBest: boolean): void {
    stopTone(0.05);
    const a = audio();
    if (!a) return;
    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const count = score >= 95 ? 5 : score >= 85 ? 4 : score >= 70 ? 3 : 2;
    const base = score >= 50 ? 0 : -12;
    const t = a.currentTime + 0.04;
    for (let i = 0; i < count; i++) {
      note(a, scale[i] * 2 ** (base / 12), t + i * 0.085, 0.5, 0.11);
      note(a, scale[i] * 2 ** (base / 12) * 2, t + i * 0.085, 0.25, 0.025, 'triangle');
    }
    if (isNewBest) {
      for (let i = 0; i < 4; i++) note(a, 2093 + i * 260, t + count * 0.085 + 0.05 + i * 0.045, 0.18, 0.04, 'triangle');
    }
  }

  function fail(): void {
    stopTone(0.03);
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const filter = a.createBiquadFilter();
    const gain = a.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.38);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.38);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(filter).connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  function setMuted(next: boolean): void {
    muted = next;
    setJSON('sound-muted', next);
    if (next) stopTone(0.02);
  }

  return { startTone, updateTone, stopTone, chime, fail, setMuted, isMuted: () => muted };
}
