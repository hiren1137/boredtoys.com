import './game.css';
import { getJSON, setJSON } from '../../lib/storage';
import { buildShareRow, readContext, type GameContext } from '../../lib/share';
import { Engine, type Voice } from './engine';
import { SOUNDS, type SoundDef } from './sounds';
import { ICONS } from './icons';

const SLUG = 'ambient-sound-mixer';
const KEY_PREFS = `${SLUG}:prefs`;
const KEY_LAST = `${SLUG}:last`;
const KEY_SAVED = `${SLUG}:mixes`;
const DEFAULT_LEVEL = 60;
const MAX_SAVED = 12;
const LOOKAHEAD = 1.6;
const SLEEP_OPTIONS = [0, 15, 30, 45, 60, 90, 120];

type Mix = Record<string, number>;
interface SavedMix {
  name: string;
  mix: Mix;
}
interface Prefs {
  master: number;
  muted: boolean;
}
interface Channel {
  gain: GainNode;
  voice: Voice;
}

const byKey = new Map(SOUNDS.map((s) => [s.key, s]));
const clampLevel = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const levelToGain = (v: number) => (v / 100) ** 2 * 1.5;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function parseMix(text: string): Mix {
  const mix: Mix = {};
  for (const part of text.replace(/^#/, '').split(/[,&]/)) {
    const [k, v] = part.split('=');
    const key = decodeURIComponent(k ?? '').trim().toLowerCase();
    const n = Number(v);
    if (byKey.has(key) && Number.isFinite(n) && n > 0) mix[key] = clampLevel(n);
  }
  return mix;
}

const mixToHash = (mix: Mix) =>
  SOUNDS.filter((s) => mix[s.key] != null)
    .map((s) => `${s.key}=${mix[s.key]}`)
    .join(',');

function describe(mix: Mix): string {
  const parts = SOUNDS.filter((s) => mix[s.key] != null)
    .sort((a, b) => mix[b.key] - mix[a.key])
    .map((s) => `${s.name} ${mix[s.key]}%`);
  if (!parts.length) return '';
  if (parts.length <= 4) return parts.join(', ');
  return `${parts.slice(0, 4).join(', ')} + ${parts.length - 4} more`;
}

/** A random mix that tends to sound good: one "bed" sound plus a couple of details. */
function randomMix(): Mix {
  const beds = ['rain', 'waves', 'wind', 'stream', 'fan', 'brown', 'pink', 'fire'];
  const details = ['thunder', 'birds', 'crickets', 'clock', 'purr', 'chimes', 'fire', 'traffic', 'rain', 'stream'];
  const mix: Mix = {};
  const bed = beds[Math.floor(Math.random() * beds.length)];
  mix[bed] = Math.round(rand(55, 80) / 5) * 5;
  const extra = Math.random() < 0.5 ? 1 : 2;
  const pool = details.filter((k) => k !== bed);
  for (let i = 0; i < extra && pool.length; i++) {
    const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    mix[k] = Math.round(rand(25, 60) / 5) * 5;
  }
  return mix;
}

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function mount(root: HTMLElement): void {
  const base = readContext(root);
  const shareCtx: GameContext = {
    ...base,
    get url() {
      const h = mixToHash(active());
      return h ? `${base.url}#${h}` : base.url;
    },
  };

  const prefs: Prefs = { master: 80, muted: false, ...getJSON<Partial<Prefs>>(KEY_PREFS, {}) };
  const levels: Record<string, number> = Object.fromEntries(SOUNDS.map((s) => [s.key, DEFAULT_LEVEL]));
  const on = new Set<string>();
  const channels = new Map<string, Channel>();
  let saved = getJSON<SavedMix[]>(KEY_SAVED, []).filter((m) => m && typeof m.name === 'string' && m.mix);
  let engine: Engine | null = null;
  let playing = false;
  let sleepEnd: number | null = null;
  let scheduler = 0;

  const el = document.createElement('div');
  el.className = 'g-ambient';
  el.innerHTML = `
    <div class="am-bar">
      <button type="button" class="btn btn--mint am-play" data-play></button>
      <label class="am-master"><span aria-hidden="true">🔊</span><span class="visually-hidden">Master volume</span>
        <input type="range" min="0" max="100" step="1" data-master></label>
      <button type="button" class="am-round" data-mute></button>
      <label class="am-sleep"><span aria-hidden="true">🌙</span> Sleep
        <select data-sleep>${SLEEP_OPTIONS.map((m) => `<option value="${m}">${m ? `${m} min` : 'Off'}</option>`).join('')}</select>
        <span class="am-left" data-left aria-live="off"></span></label>
      <button type="button" class="btn btn--sky btn--small" data-random>🎲 Random mix</button>
      <button type="button" class="btn btn--white btn--small" data-clear>Clear</button>
    </div>
    <p class="am-status" data-status role="status"></p>
    <ul class="am-grid" data-grid></ul>
    <div class="am-bottom">
      <section class="am-card" aria-label="Your mix">
        <p class="am-h">Your mix</p>
        <p class="am-desc" data-desc></p>
        <div data-share></div>
      </section>
      <section class="am-card" aria-label="Saved mixes">
        <p class="am-h">Saved mixes</p>
        <form class="am-save" data-save>
          <label class="visually-hidden" for="am-name">Name your mix</label>
          <input id="am-name" type="text" maxlength="30" placeholder="Name this mix" autocomplete="off" data-name>
          <button type="submit" class="btn btn--small btn--pink">💾 Save</button>
        </form>
        <ul class="am-saved" data-saved></ul>
      </section>
    </div>`;
  root.append(el);

  const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const playBtn = q<HTMLButtonElement>('[data-play]');
  const masterIn = q<HTMLInputElement>('[data-master]');
  const muteBtn = q<HTMLButtonElement>('[data-mute]');
  const sleepSel = q<HTMLSelectElement>('[data-sleep]');
  const leftEl = q<HTMLElement>('[data-left]');
  const statusEl = q<HTMLElement>('[data-status]');
  const grid = q<HTMLUListElement>('[data-grid]');
  const descEl = q<HTMLElement>('[data-desc]');
  const shareEl = q<HTMLElement>('[data-share]');
  const saveForm = q<HTMLFormElement>('[data-save]');
  const nameIn = q<HTMLInputElement>('[data-name]');
  const savedList = q<HTMLUListElement>('[data-saved]');

  const tiles = new Map<string, { li: HTMLLIElement; btn: HTMLButtonElement; range: HTMLInputElement }>();
  for (const s of SOUNDS) {
    const li = document.createElement('li');
    li.className = 'am-tile';
    li.style.setProperty('--am-color', s.color);
    li.innerHTML = `
      <button type="button" class="am-toggle" aria-pressed="false">
        <span class="am-art">${ICONS[s.key] ?? ''}</span>
        <span class="am-name">${s.name}</span>
      </button>
      <input type="range" min="0" max="100" step="1" class="am-range" aria-label="${s.name} volume">`;
    const btn = li.querySelector('button')!;
    const range = li.querySelector('input')!;
    btn.addEventListener('click', () => toggle(s));
    range.addEventListener('input', () => setLevel(s, Number(range.value)));
    grid.append(li);
    tiles.set(s.key, { li, btn, range });
  }

  function active(): Mix {
    const mix: Mix = {};
    for (const k of on) mix[k] = levels[k];
    return mix;
  }

  function say(text: string): void {
    statusEl.textContent = text;
  }

  // ---------- Audio ----------
  function ensureEngine(): Engine | null {
    if (engine) return engine;
    engine = Engine.create();
    if (!engine) {
      say('Sorry, your browser cannot play generated sound.');
      return null;
    }
    try {
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
    } catch {
      /* optional */
    }
    engine.master.gain.value = masterGain();
    scheduler = window.setInterval(pump, 250);
    return engine;
  }

  const masterGain = () => (prefs.muted ? 0 : (prefs.master / 100) ** 2);

  function pump(): void {
    if (engine && playing) {
      const until = engine.now + LOOKAHEAD;
      for (const ch of channels.values()) ch.voice.tick?.(until);
    }
    if (sleepEnd != null) {
      const left = sleepEnd - Date.now();
      leftEl.textContent = fmtLeft(left);
      if (left <= 0) finishSleep();
    }
  }

  function startChannel(s: SoundDef): void {
    if (!engine || channels.has(s.key)) return;
    const e = engine;
    const gain = e.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(e.bus);
    const voice = s.build(e, gain);
    gain.gain.setTargetAtTime(levelToGain(levels[s.key]), e.now, 0.35);
    channels.set(s.key, { gain, voice });
    voice.tick?.(e.now + LOOKAHEAD);
  }

  function stopChannel(key: string, fade = 0.2): void {
    const ch = channels.get(key);
    if (!ch || !engine) return;
    channels.delete(key);
    const t = engine.now;
    ch.gain.gain.cancelScheduledValues(t);
    ch.gain.gain.setValueAtTime(ch.gain.gain.value, t);
    ch.gain.gain.setTargetAtTime(0, t, fade);
    ch.voice.stop(t + fade * 6);
    window.setTimeout(() => ch.gain.disconnect(), (fade * 6 + LOOKAHEAD + 0.5) * 1000);
  }

  function play(): void {
    const e = ensureEngine();
    if (!e) return;
    if (!on.size) applyMix(randomMix(), false);
    void e.ctx.resume();
    playing = true;
    for (const k of on) startChannel(byKey.get(k)!);
    scheduleSleepFade();
    say('');
    render();
  }

  function pause(message = ''): void {
    playing = false;
    for (const k of [...channels.keys()]) stopChannel(k, 0.08);
    if (engine) {
      const e = engine;
      e.bus.gain.cancelScheduledValues(e.now);
      e.bus.gain.setValueAtTime(1, e.now);
      window.setTimeout(() => {
        if (!playing) void e.ctx.suspend();
      }, 700);
    }
    say(message);
    render();
  }

  function scheduleSleepFade(): void {
    if (!engine) return;
    const e = engine;
    const g = e.bus.gain;
    g.cancelScheduledValues(e.now);
    g.setValueAtTime(1, e.now);
    if (sleepEnd == null || !playing) return;
    const left = (sleepEnd - Date.now()) / 1000;
    const fade = Math.min(60, Math.max(1, left / 3));
    g.setValueAtTime(1, e.now + Math.max(0, left - fade));
    g.linearRampToValueAtTime(0.0001, e.now + Math.max(0.05, left));
  }

  function finishSleep(): void {
    sleepEnd = null;
    sleepSel.value = '0';
    leftEl.textContent = '';
    if (playing) pause('😴 Sleep timer finished. Sound faded out. Sweet dreams!');
  }

  // ---------- Mix changes ----------
  function toggle(s: SoundDef): void {
    if (on.has(s.key)) {
      on.delete(s.key);
      stopChannel(s.key);
      if (!on.size && playing) pause();
    } else {
      on.add(s.key);
      if (levels[s.key] === 0) levels[s.key] = DEFAULT_LEVEL;
      if (playing) startChannel(s);
      else play();
    }
    changed();
  }

  function setLevel(s: SoundDef, v: number): void {
    levels[s.key] = clampLevel(v);
    if (!on.has(s.key)) {
      if (v <= 0) return render();
      on.add(s.key);
      if (playing) startChannel(s);
      else play();
    }
    const ch = channels.get(s.key);
    if (ch && engine) ch.gain.gain.setTargetAtTime(levelToGain(levels[s.key]), engine.now, 0.08);
    changed();
  }

  function applyMix(mix: Mix, restart = true): void {
    for (const k of [...on]) {
      if (mix[k] == null) {
        on.delete(k);
        stopChannel(k);
      }
    }
    for (const [k, v] of Object.entries(mix)) {
      levels[k] = v;
      on.add(k);
      const ch = channels.get(k);
      if (ch && engine) ch.gain.gain.setTargetAtTime(levelToGain(v), engine.now, 0.15);
      else if (restart && playing) startChannel(byKey.get(k)!);
    }
    changed();
  }

  function changed(): void {
    const mix = active();
    const hash = mixToHash(mix);
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`);
    } catch {
      /* some embedded browsers block replaceState */
    }
    setJSON(KEY_LAST, mix);
    render();
  }

  // ---------- Rendering ----------
  function render(): void {
    for (const s of SOUNDS) {
      const t = tiles.get(s.key)!;
      const isOn = on.has(s.key);
      t.li.classList.toggle('is-on', isOn);
      t.li.classList.toggle('is-playing', isOn && playing);
      t.btn.setAttribute('aria-pressed', String(isOn));
      t.btn.setAttribute('aria-label', `${s.name}: ${isOn ? 'on' : 'off'}`);
      if (Number(t.range.value) !== levels[s.key]) t.range.value = String(levels[s.key]);
      t.range.setAttribute('aria-valuetext', `${levels[s.key]}%`);
    }
    playBtn.textContent = playing ? '⏸ Pause' : on.size ? '▶ Play mix' : '▶ Play';
    playBtn.setAttribute('aria-pressed', String(playing));
    masterIn.value = String(prefs.master);
    masterIn.setAttribute('aria-valuetext', `${prefs.master}%`);
    muteBtn.textContent = prefs.muted ? '🔇' : '🔈';
    muteBtn.setAttribute('aria-label', prefs.muted ? 'Unmute' : 'Mute');
    muteBtn.setAttribute('aria-pressed', String(prefs.muted));
    const d = describe(active());
    descEl.textContent = d || 'Nothing picked yet. Tap a sound, or try a random mix.';
    shareEl.style.visibility = d ? '' : 'hidden';
    renderSaved();
  }

  function renderSaved(): void {
    savedList.innerHTML = '';
    if (!saved.length) {
      const li = document.createElement('li');
      li.className = 'am-empty';
      li.textContent = 'Your saved mixes live here, on this device only.';
      savedList.append(li);
      return;
    }
    saved.forEach((m, i) => {
      const li = document.createElement('li');
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'am-load';
      load.textContent = m.name;
      load.title = describe(m.mix);
      load.addEventListener('click', () => {
        applyMix(parseMix(mixToHash(m.mix)));
        if (!playing) play();
        say(`Playing "${m.name}"`);
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'am-del';
      del.textContent = '×';
      del.setAttribute('aria-label', `Delete ${m.name}`);
      del.addEventListener('click', () => {
        saved.splice(i, 1);
        setJSON(KEY_SAVED, saved);
        renderSaved();
        say(`Deleted "${m.name}"`);
      });
      li.append(load, del);
      savedList.append(li);
    });
  }

  function savePrefs(): void {
    setJSON(KEY_PREFS, prefs);
  }

  // ---------- Controls ----------
  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  masterIn.addEventListener('input', () => {
    prefs.master = clampLevel(Number(masterIn.value));
    if (prefs.muted && prefs.master > 0) prefs.muted = false;
    if (engine) engine.master.gain.setTargetAtTime(masterGain(), engine.now, 0.05);
    savePrefs();
    render();
  });
  muteBtn.addEventListener('click', () => {
    prefs.muted = !prefs.muted;
    if (engine) engine.master.gain.setTargetAtTime(masterGain(), engine.now, 0.05);
    savePrefs();
    render();
  });
  sleepSel.addEventListener('change', () => {
    const m = Number(sleepSel.value);
    sleepEnd = m > 0 ? Date.now() + m * 60_000 : null;
    leftEl.textContent = sleepEnd ? fmtLeft(m * 60_000) : '';
    scheduleSleepFade();
    if (sleepEnd && !scheduler) scheduler = window.setInterval(pump, 250);
    say(m ? `Sleep timer set. Sound fades out in ${m} minutes.` : 'Sleep timer off.');
  });
  q('[data-random]').addEventListener('click', () => {
    applyMix(randomMix());
    if (!playing) play();
    say(`Random mix: ${describe(active())}`);
  });
  q('[data-clear]').addEventListener('click', () => {
    applyMix({});
    if (playing) pause();
    say('Mix cleared.');
  });
  saveForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const mix = active();
    if (!Object.keys(mix).length) {
      say('Turn on at least one sound before saving.');
      return;
    }
    const name = nameIn.value.trim().slice(0, 30) || `Mix ${saved.length + 1}`;
    saved = [{ name, mix }, ...saved.filter((m) => m.name !== name)].slice(0, MAX_SAVED);
    setJSON(KEY_SAVED, saved);
    nameIn.value = '';
    renderSaved();
    say(`Saved "${name}" on this device.`);
  });

  shareEl.append(buildShareRow(shareCtx, () => describe(active()) || undefined));

  // ---------- Start ----------
  const fromHash = parseMix(location.hash);
  const startMix = Object.keys(fromHash).length ? fromHash : getJSON<Mix>(KEY_LAST, {});
  for (const [k, v] of Object.entries(parseMix(mixToHash(startMix)))) {
    on.add(k);
    levels[k] = v;
  }
  render();
  if (Object.keys(fromHash).length) say('🎧 Someone shared this mix with you. Press Play to listen.');
  else if (on.size) say('Your last mix is ready. Press Play to listen.');
  else say('Tap any sound to start. Mix as many as you like.');
}
