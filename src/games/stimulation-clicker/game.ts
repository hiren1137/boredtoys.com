import './game.css';
import { getBest, getJSON, saveBest, setJSON } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { HEADLINES, HYPE, PINGS, STOCKS, UPGRADES, type Upgrade, type UpgradeId } from './data';
import { createSound } from './sound';

const SLUG = 'stimulation-clicker';
const SAVE_KEY = 'stim-save';
const COLORS = ['#ff7466', '#ffd447', '#6be3a8', '#6cc8ff', '#c7a3ff', '#ffa3d1', '#ffac57'];
const INK = '#1f1a2e';

interface Save {
  v: 1;
  pts: number;
  total: number;
  clicks: number;
  bought: UpgradeId[];
  ms: number;
}

interface Stats {
  spc: number;
  sps: number;
  shapes: number;
  bounce: number;
  logos: number;
  logoValue: number;
  auto: number;
}

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  kind: number;
  color: string;
  rot: number;
  vr: number;
}

interface Logo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  hitX: number;
  hitY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  text?: string;
}

const LOGO_W = 96;
const LOGO_H = 46;

function freshSave(): Save {
  return { v: 1, pts: 0, total: 0, clicks: 0, bought: [], ms: 0 };
}

function loadSave(): Save {
  const s = getJSON<Save | null>(SAVE_KEY, null);
  if (!s || s.v !== 1 || !Array.isArray(s.bought) || !Number.isFinite(s.pts) || !Number.isFinite(s.total)) return freshSave();
  const known = new Set(UPGRADES.map((u) => u.id));
  return {
    v: 1,
    pts: Math.max(0, s.pts),
    total: Math.max(0, s.total),
    clicks: Math.max(0, Math.floor(s.clicks) || 0),
    bought: s.bought.filter((id) => known.has(id) && id !== 'peace'),
    ms: Math.max(0, s.ms || 0),
  };
}

function computeStats(bought: Set<UpgradeId>): Stats {
  let spcAdd = 0;
  let spcMul = 1;
  let spsAdd = 0;
  let spsMul = 1;
  let shapes = 0;
  let bounceMul = 1;
  let logos = 0;
  let logoMul = 1;
  let auto = 0;
  let allMul = 1;
  for (const u of UPGRADES) {
    if (!bought.has(u.id)) continue;
    const e = u.effect;
    spcAdd += e.spcAdd ?? 0;
    spcMul *= e.spcMul ?? 1;
    spsAdd += e.spsAdd ?? 0;
    spsMul *= e.spsMul ?? 1;
    shapes += e.shapes ?? 0;
    bounceMul *= e.bounceMul ?? 1;
    logos += e.logos ?? 0;
    logoMul *= e.logoMul ?? 1;
    if (e.auto) auto = e.auto;
    allMul *= e.allMul ?? 1;
  }
  return {
    spc: (1 + spcAdd) * spcMul * allMul,
    sps: spsAdd * spsMul * allMul,
    shapes,
    bounce: 3 * bounceMul * allMul,
    logos,
    logoValue: 15 * logoMul * allMul,
    auto,
  };
}

function fmt(n: number): string {
  const v = Math.floor(n);
  if (v < 1e6) return v.toLocaleString('en-US');
  const units: [number, string][] = [
    [1e15, 'quadrillion'],
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
  ];
  for (const [size, name] of units) {
    if (v >= size) return `${Number((v / size).toFixed(2))} ${name}`;
  }
  return String(v);
}

function clock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function duration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const HAND_SVG = `<svg viewBox="0 0 60 60" width="54" height="54" aria-hidden="true"><g stroke="${INK}" stroke-width="3" stroke-linejoin="round"><rect x="30" y="34" width="26" height="18" rx="6" fill="#c7a3ff"/><path d="M8 12c0-4 6-4 6 0v20h10c6 0 8 3 8 8v6c0 6-4 10-10 10H16c-5 0-8-4-8-9z" fill="#dcd8e4"/><circle cx="43" cy="43" r="3" fill="${INK}"/></g></svg>`;
const PINATA_SVG = `<svg viewBox="0 0 90 80" width="90" height="80" aria-hidden="true"><g stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"><path d="M45 0v10" fill="none"/><path d="M14 30c0-12 10-20 22-20h20c10 0 18 8 18 18v18c0 8-6 14-14 14H28c-8 0-14-6-14-14z" fill="#ffa3d1"/><path d="M14 38h60M14 48h60" stroke="#ffd447" stroke-width="6"/><path d="M74 26l14-8v18z" fill="#6be3a8"/><path d="M24 60v14M38 60v14M52 60v14M64 60v14" fill="none"/></g><circle cx="64" cy="24" r="3" fill="${INK}"/></svg>`;

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-stim';
  root.append(el);
  const sound = createSound();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let teardown: (() => void) | null = null;

  function start(save: Save): void {
    teardown?.();
    teardown = run(save);
  }

  function run(save: Save): () => void {
    const off = new AbortController();
    const sig = { signal: off.signal };
    const bought = new Set<UpgradeId>(save.bought);
    let stats = computeStats(bought);
    let gestured = false;
    let ended = false;
    let raf = 0;
    const best = getBest(SLUG);

    el.dataset.state = 'playing';
    el.innerHTML = `
      <div class="st-field" data-field>
        <canvas class="st-canvas" aria-hidden="true"></canvas>
        <div class="st-ticker" data-ticker hidden><div class="st-ticker-track" data-ticker-track></div></div>
        <div class="st-hud">
          <p class="st-count"><span data-count>0</span> <small>stimulation</small></p>
          <p class="st-rate" data-rate hidden></p>
        </div>
        <div class="st-tools">
          <span class="st-time"><span class="visually-hidden">Time played: </span><span data-time>0:00</span>${best != null ? ` <span class="st-best">best ${clock(best * 1000)}</span>` : ''}</span>
          <button type="button" class="st-tool" data-mute></button>
          <button type="button" class="st-tool st-tool--reset" data-reset>Start over</button>
        </div>
        <div class="st-pings" data-pings></div>
        <div class="st-center">
          <p class="st-hype" data-hype aria-hidden="true"></p>
          <button type="button" class="st-press" data-press>Click me</button>
          <div class="st-hand" data-hand hidden>${HAND_SVG}</div>
        </div>
        <div class="st-stocks" data-stocks hidden></div>
        <div class="st-dash" data-dash hidden><canvas width="150" height="72" aria-hidden="true"></canvas><span>Tiny Dash</span></div>
        <div class="st-eq" data-eq hidden aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <button type="button" class="st-pinata" data-pinata hidden aria-label="Whack the pinata">${PINATA_SVG}</button>
      </div>
      <div class="st-shop">
        <p class="st-shop-title">Upgrades <span data-owned></span></p>
        <ul class="st-list" data-list></ul>
      </div>
      <p class="visually-hidden" aria-live="polite" data-announce></p>`;

    const $ = <T extends Element>(s: string) => el.querySelector(s) as T;
    const field = $<HTMLDivElement>('[data-field]');
    const canvas = $<HTMLCanvasElement>('.st-canvas');
    const g = canvas.getContext('2d')!;
    const countEl = $<HTMLSpanElement>('[data-count]');
    const rateEl = $<HTMLParagraphElement>('[data-rate]');
    const timeEl = $<HTMLSpanElement>('[data-time]');
    const muteBtn = $<HTMLButtonElement>('[data-mute]');
    const resetBtn = $<HTMLButtonElement>('[data-reset]');
    const press = $<HTMLButtonElement>('[data-press]');
    const hand = $<HTMLDivElement>('[data-hand]');
    const hype = $<HTMLParagraphElement>('[data-hype]');
    const ticker = $<HTMLDivElement>('[data-ticker]');
    const tickerTrack = $<HTMLDivElement>('[data-ticker-track]');
    const pingsEl = $<HTMLDivElement>('[data-pings]');
    const dash = $<HTMLDivElement>('[data-dash]');
    const dashCanvas = dash.querySelector('canvas')!;
    const dg = dashCanvas.getContext('2d')!;
    const eq = $<HTMLDivElement>('[data-eq]');
    const stocksEl = $<HTMLDivElement>('[data-stocks]');
    const pinata = $<HTMLButtonElement>('[data-pinata]');
    const list = $<HTMLUListElement>('[data-list]');
    const owned = $<HTMLSpanElement>('[data-owned]');
    const announce = $<HTMLParagraphElement>('[data-announce]');

    // ---------- Canvas sizing ----------
    let W = 0;
    let H = 0;
    function resize(): void {
      const r = field.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const s of shapes) {
        s.x = Math.min(s.x, W - s.size);
        s.y = Math.min(s.y, H - s.size);
      }
      for (const l of logos) {
        l.x = Math.min(l.x, Math.max(0, W - LOGO_W));
        l.y = Math.min(l.y, Math.max(0, H - LOGO_H));
      }
    }
    const ro = new ResizeObserver(resize);
    ro.observe(field);

    const small = () => W < 520;
    const maxParticles = () => (reduceMotion ? 30 : small() ? 90 : 170);
    const speedMul = () => (reduceMotion ? 0.35 : 1) * (bought.has('hyper') ? 1.4 : 1);

    // ---------- Moving things ----------
    const shapes: Shape[] = [];
    const logos: Logo[] = [];
    const particles: Particle[] = [];

    function addShape(): void {
      const size = 18 + Math.random() * 18;
      const a = Math.random() * Math.PI * 2;
      const sp = 90 + Math.random() * 60;
      shapes.push({
        x: Math.random() * Math.max(1, W - size),
        y: Math.random() * Math.max(1, H - size),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size,
        kind: shapes.length === 0 ? 0 : shapes.length % 4,
        color: COLORS[shapes.length % COLORS.length],
        rot: 0,
        vr: (Math.random() - 0.5) * 3,
      });
    }

    function addLogo(): void {
      logos.push({
        x: Math.random() * Math.max(1, W - LOGO_W),
        y: Math.random() * Math.max(1, H - LOGO_H),
        vx: (Math.random() < 0.5 ? -1 : 1) * 105,
        vy: (Math.random() < 0.5 ? -1 : 1) * 80,
        color: logos.length % COLORS.length,
        hitX: -99,
        hitY: -99,
      });
    }

    function spawn(x: number, y: number, n: number, kind: 'spark' | 'confetti'): void {
      const room = maxParticles() - particles.length;
      const count = Math.min(n, room, reduceMotion ? 2 : n);
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = kind === 'confetti' ? 160 + Math.random() * 220 : 60 + Math.random() * 120;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (kind === 'confetti' ? 140 : 40),
          life: 0,
          max: kind === 'confetti' ? 1.2 : 0.55,
          color: pick(COLORS),
          size: kind === 'confetti' ? 5 + Math.random() * 4 : 3 + Math.random() * 3,
        });
      }
    }

    function floatText(x: number, y: number, text: string, color = INK): void {
      if (particles.length >= maxParticles() + 20) return;
      particles.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: -70, life: 0, max: 0.9, color, size: 15, text });
    }

    // ---------- Economy ----------
    function earn(n: number): void {
      save.pts += n;
      save.total += n;
    }

    function pressCenter(): { x: number; y: number } {
      const r = press.getBoundingClientRect();
      const f = field.getBoundingClientRect();
      return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2 };
    }

    let combo = 0;
    let lastPress = 0;
    let lastHype = 0;
    function doPress(manual: boolean, at?: { x: number; y: number }): void {
      if (ended) return;
      earn(stats.spc);
      const p = at ?? pressCenter();
      if (manual) {
        save.clicks++;
        const now = performance.now();
        combo = now - lastPress < 400 ? combo + 1 : 0;
        lastPress = now;
        sound.click(combo);
        if (!gestured) {
          gestured = true;
          if (bought.has('beat')) sound.startBeat(bought.has('bass') ? 2 : 1);
        }
        if (bought.has('hype') && now - lastHype > 1100) {
          lastHype = now;
          hype.textContent = pick(HYPE);
          hype.classList.remove('is-on');
          void hype.offsetWidth;
          hype.classList.add('is-on');
        }
      }
      floatText(p.x + (Math.random() - 0.5) * 40, p.y - 20, `+${fmt(stats.spc)}`);
      if (bought.has('sparkle')) spawn(p.x, p.y, manual ? 6 : 2, 'spark');
      if (bought.has('confetti') && manual) spawn(p.x, p.y, bought.has('hyper') ? 18 : 10, 'confetti');
    }

    press.addEventListener(
      'click',
      (e) => {
        const f = field.getBoundingClientRect();
        const at = e.detail > 0 && e.clientX ? { x: e.clientX - f.left, y: e.clientY - f.top } : undefined;
        doPress(true, at);
      },
      sig,
    );
    press.addEventListener('keydown', (e) => {
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
    }, sig);

    // ---------- Widgets switched on by upgrades ----------
    let tickerIndex = 0;
    function buildTicker(): void {
      ticker.hidden = false;
      if (reduceMotion) {
        tickerTrack.textContent = HEADLINES[0];
        return;
      }
      const items = [...HEADLINES].sort(() => Math.random() - 0.5);
      const line = items.map((h) => `<span>${h}</span>`).join('');
      tickerTrack.innerHTML = line + line;
      tickerTrack.style.animationDuration = `${items.length * 4.5}s`;
    }

    const stockVals = STOCKS.map(() => 20 + Math.random() * 80);
    function buildStocks(): void {
      stocksEl.hidden = false;
      stocksEl.innerHTML = STOCKS.map((s) => `<span class="st-stock"><b>${s}</b> <span data-v></span></span>`).join('');
      updateStocks();
    }
    function updateStocks(): void {
      const spans = stocksEl.querySelectorAll<HTMLSpanElement>('[data-v]');
      spans.forEach((span, i) => {
        const change = (Math.random() - 0.48) * stockVals[i] * 0.08;
        stockVals[i] = Math.max(0.5, stockVals[i] + change);
        span.textContent = `${stockVals[i].toFixed(2)} ${change >= 0 ? '▲' : '▼'}${Math.abs(change).toFixed(2)}`;
        span.className = change >= 0 ? 'is-up' : 'is-down';
      });
    }

    function applyVisual(id: UpgradeId, fresh: boolean): void {
      switch (id) {
        case 'square':
        case 'shapes':
          while (shapes.length < stats.shapes) addShape();
          break;
        case 'logo':
        case 'clones':
          while (logos.length < stats.logos) addLogo();
          break;
        case 'meter':
          rateEl.hidden = false;
          break;
        case 'ticker':
          buildTicker();
          break;
        case 'poker':
        case 'turbo':
          hand.hidden = false;
          hand.classList.toggle('is-fast', id === 'turbo' || bought.has('turbo'));
          break;
        case 'beat':
        case 'bass':
          eq.hidden = false;
          el.classList.toggle('is-bass', bought.has('bass'));
          if (gestured) sound.startBeat(bought.has('bass') ? 2 : 1);
          break;
        case 'stonks':
          buildStocks();
          break;
        case 'dash':
          dash.hidden = false;
          break;
        case 'rainbow':
          field.classList.add('is-rainbow');
          break;
        case 'wobble':
          field.classList.add('is-wobble');
          break;
        case 'hyper':
          field.classList.add('is-hyper');
          break;
        default:
          break;
      }
      if (fresh && id !== 'peace') {
        const c = pressCenter();
        spawn(c.x, c.y, 24, 'confetti');
      }
    }

    // ---------- Shop ----------
    let shopSig = '';
    function visibleUpgrades(): Upgrade[] {
      const rest = UPGRADES.filter((u) => u.id !== 'peace' && !bought.has(u.id));
      return rest.length ? rest.slice(0, 4) : UPGRADES.filter((u) => u.id === 'peace');
    }

    function renderShop(force = false): void {
      const vis = visibleUpgrades();
      const signature = vis
        .map((u, i) => `${u.id}:${save.pts >= u.cost ? 1 : 0}:${i === 0 || save.total >= u.cost * 0.35 ? 1 : 0}`)
        .join('|');
      if (!force && signature === shopSig) return;
      shopSig = signature;
      const focusedId = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.st-item')?.dataset.id;
      const focusInList = !!focusedId;
      list.innerHTML = vis
        .map((u, i) => {
          const revealed = i === 0 || save.total >= u.cost * 0.35;
          const can = save.pts >= u.cost;
          return `<li><button type="button" class="st-item${u.id === 'peace' ? ' st-item--peace' : ''}" data-id="${u.id}" aria-disabled="${!can}">
            <span class="st-item-name">${revealed ? u.name : '???'}</span>
            <span class="st-item-desc">${revealed ? u.desc : 'Keep clicking to find out.'}</span>
            <span class="st-item-cost">${fmt(u.cost)}</span>
          </button></li>`;
        })
        .join('');
      owned.textContent = `${bought.size} / ${UPGRADES.length}`;
      if (focusInList) {
        const target = list.querySelector<HTMLButtonElement>(`[data-id="${focusedId}"]`) ?? list.querySelector<HTMLButtonElement>('.st-item');
        target?.focus({ preventScroll: true });
      }
    }

    list.addEventListener(
      'click',
      (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.st-item');
        if (!btn) return;
        const u = UPGRADES.find((x) => x.id === btn.dataset.id);
        if (!u || bought.has(u.id) || save.pts < u.cost) return;
        if (!gestured) gestured = true;
        save.pts -= u.cost;
        if (u.id === 'peace') {
          finish();
          return;
        }
        bought.add(u.id);
        save.bought = [...bought];
        stats = computeStats(bought);
        sound.buy();
        applyVisual(u.id, true);
        announce.textContent = `Bought ${u.name}.`;
        persist();
        renderShop(true);
      },
      sig,
    );

    // ---------- Notifications and pinata ----------
    let pingTimer = 6 + Math.random() * 4;
    function addPing(): void {
      const max = small() ? 2 : 3;
      while (pingsEl.children.length >= max) pingsEl.firstElementChild?.remove();
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'st-ping';
      const bonus = Math.max(40, Math.round(stats.sps * 8));
      b.innerHTML = `<span class="st-ping-dot" aria-hidden="true"></span><span>${pick(PINGS)}</span><b>+${fmt(bonus)}</b>`;
      b.addEventListener('click', () => {
        earn(bonus);
        sound.ping();
        const r = b.getBoundingClientRect();
        const f = field.getBoundingClientRect();
        floatText(r.left - f.left + r.width / 2, r.top - f.top, `+${fmt(bonus)}`, '#1f9d55');
        b.remove();
      });
      pingsEl.append(b);
      sound.ping();
      window.setTimeout(() => b.remove(), 7000);
    }

    let pinataTimer = 20 + Math.random() * 10;
    let pinataHits = 0;
    let pinataLife = 0;
    function showPinata(): void {
      pinataHits = 0;
      pinataLife = 9;
      pinata.hidden = false;
      pinata.style.left = `${10 + Math.random() * Math.max(10, W - 110)}px`;
      pinata.style.top = `${70 + Math.random() * Math.max(10, H - 200)}px`;
      pinata.classList.remove('is-hit');
    }
    pinata.addEventListener(
      'click',
      () => {
        pinataHits++;
        sound.whack();
        pinata.classList.remove('is-hit');
        void pinata.offsetWidth;
        pinata.classList.add('is-hit');
        if (pinataHits >= 3) {
          const bonus = Math.max(500, Math.round(stats.sps * 25));
          earn(bonus);
          const r = pinata.getBoundingClientRect();
          const f = field.getBoundingClientRect();
          const x = r.left - f.left + r.width / 2;
          const y = r.top - f.top + r.height / 2;
          spawn(x, y, 40, 'confetti');
          floatText(x, y, `+${fmt(bonus)}`, '#a12a5e');
          sound.jackpot();
          pinata.hidden = true;
          announce.textContent = `Pinata smashed. +${fmt(bonus)}`;
        }
      },
      sig,
    );

    // ---------- Tiny Dash minigame ----------
    const dashState = { y: 0, vy: 0, obstacles: [] as number[], coins: [] as { x: number; y: number }[], spawnO: 1, spawnC: 0.6, coinsGot: 0, t: 0 };
    function stepDash(dt: number): void {
      const d = dashState;
      const speed = 70 * (reduceMotion ? 0.5 : 1);
      d.t += dt;
      d.spawnO -= dt;
      d.spawnC -= dt;
      if (d.spawnO <= 0) {
        d.obstacles.push(160);
        d.spawnO = 1.6 + Math.random() * 1.2;
      }
      if (d.spawnC <= 0) {
        d.coins.push({ x: 160, y: 18 + Math.random() * 18 });
        d.spawnC = 0.9 + Math.random() * 0.8;
      }
      d.obstacles = d.obstacles.map((x) => x - speed * dt).filter((x) => x > -10);
      const bx = 34;
      if (d.y === 0 && d.obstacles.some((x) => x > bx && x - bx < 24)) d.vy = 150;
      d.vy -= 460 * dt;
      d.y = Math.max(0, d.y + d.vy * dt);
      if (d.y === 0) d.vy = 0;
      const by = 56 - 9 - d.y;
      d.coins = d.coins
        .map((c) => ({ x: c.x - speed * dt, y: c.y }))
        .filter((c) => {
          if (Math.abs(c.x - bx) < 11 && Math.abs(c.y - by) < 15) {
            d.coinsGot++;
            earn(Math.max(5, stats.sps));
            return false;
          }
          return c.x > -10;
        });
      dg.clearRect(0, 0, 150, 72);
      dg.fillStyle = '#eaf7ff';
      dg.fillRect(0, 0, 150, 72);
      dg.fillStyle = '#6be3a8';
      dg.fillRect(0, 56, 150, 16);
      dg.strokeStyle = INK;
      dg.lineWidth = 2;
      dg.beginPath();
      dg.moveTo(0, 56);
      dg.lineTo(150, 56);
      dg.stroke();
      for (const x of d.obstacles) {
        dg.fillStyle = '#ff7466';
        dg.beginPath();
        dg.moveTo(x - 7, 56);
        dg.lineTo(x, 42);
        dg.lineTo(x + 7, 56);
        dg.closePath();
        dg.fill();
        dg.stroke();
      }
      for (const c of d.coins) {
        dg.fillStyle = '#ffd447';
        dg.beginPath();
        dg.arc(c.x, c.y, 5, 0, Math.PI * 2);
        dg.fill();
        dg.stroke();
      }
      dg.fillStyle = '#c7a3ff';
      dg.beginPath();
      dg.arc(bx, by, 9, 0, Math.PI * 2);
      dg.fill();
      dg.stroke();
      dg.fillStyle = INK;
      dg.beginPath();
      dg.arc(bx + 4, by - 2, 2, 0, Math.PI * 2);
      dg.fill();
      dg.font = '900 10px system-ui, sans-serif';
      dg.fillText(`COINS ${d.coinsGot}`, 6, 12);
    }

    // ---------- Drawing ----------
    function drawShape(s: Shape): void {
      g.save();
      g.translate(s.x + s.size / 2, s.y + s.size / 2);
      g.rotate(s.rot);
      g.fillStyle = s.color;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      const h = s.size / 2;
      g.beginPath();
      if (s.kind === 0) g.rect(-h, -h, s.size, s.size);
      else if (s.kind === 1) g.arc(0, 0, h, 0, Math.PI * 2);
      else if (s.kind === 2) {
        g.moveTo(0, -h);
        g.lineTo(h, h);
        g.lineTo(-h, h);
        g.closePath();
      } else {
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? h * 0.45 : h;
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
      }
      g.fill();
      g.stroke();
      g.restore();
    }

    function drawLogo(l: Logo): void {
      g.fillStyle = COLORS[l.color];
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      if (g.roundRect) g.roundRect(l.x, l.y, LOGO_W, LOGO_H, 14);
      else g.rect(l.x, l.y, LOGO_W, LOGO_H);
      g.fill();
      g.stroke();
      g.fillStyle = INK;
      g.font = '900 22px system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('ZONK', l.x + LOGO_W / 2, l.y + LOGO_H / 2 + 1);
      g.beginPath();
      g.arc(l.x + LOGO_W - 12, l.y + 10, 3, 0, Math.PI * 2);
      g.arc(l.x + LOGO_W - 22, l.y + 10, 3, 0, Math.PI * 2);
      g.fill();
    }

    let spin = 0;
    function drawPinwheel(x: number, y: number, r: number, a: number): void {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.strokeStyle = INK;
      g.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        g.rotate(Math.PI / 2);
        g.fillStyle = COLORS[i * 2 % COLORS.length];
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(r, 0);
        g.quadraticCurveTo(r, r * 0.8, 0, r * 0.2);
        g.closePath();
        g.fill();
        g.stroke();
      }
      g.fillStyle = INK;
      g.beginPath();
      g.arc(0, 0, 3.5, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    let frame = 0;
    function step(dt: number): void {
      frame++;
      const sm = speedMul();
      for (const s of shapes) {
        s.x += s.vx * dt * sm;
        s.y += s.vy * dt * sm;
        s.rot += s.vr * dt * sm;
        let hit = false;
        if (s.x < 0) (s.x = 0), (s.vx = Math.abs(s.vx)), (hit = true);
        if (s.x > W - s.size) (s.x = W - s.size), (s.vx = -Math.abs(s.vx)), (hit = true);
        if (s.y < 0) (s.y = 0), (s.vy = Math.abs(s.vy)), (hit = true);
        if (s.y > H - s.size) (s.y = H - s.size), (s.vy = -Math.abs(s.vy)), (hit = true);
        if (hit) {
          earn(stats.bounce);
          if (shapes.length <= 2) floatText(s.x + s.size / 2, s.y, `+${fmt(stats.bounce)}`);
        }
      }
      for (const l of logos) {
        l.x += l.vx * dt * sm;
        l.y += l.vy * dt * sm;
        let hx = false;
        let hy = false;
        if (l.x < 0) (l.x = 0), (l.vx = Math.abs(l.vx)), (hx = true);
        if (l.x > W - LOGO_W) (l.x = Math.max(0, W - LOGO_W)), (l.vx = -Math.abs(l.vx)), (hx = true);
        if (l.y < 0) (l.y = 0), (l.vy = Math.abs(l.vy)), (hy = true);
        if (l.y > H - LOGO_H) (l.y = Math.max(0, H - LOGO_H)), (l.vy = -Math.abs(l.vy)), (hy = true);
        if (hx) l.hitX = frame;
        if (hy) l.hitY = frame;
        if (hx || hy) {
          l.color = (l.color + 1) % COLORS.length;
          if (Math.abs(l.hitX - l.hitY) <= 6) {
            const bonus = stats.logoValue * 50;
            earn(bonus);
            floatText(l.x + LOGO_W / 2, l.y + LOGO_H / 2, `CORNER! +${fmt(bonus)}`, '#a12a5e');
            spawn(l.x + LOGO_W / 2, l.y + LOGO_H / 2, 40, 'confetti');
            sound.jackpot();
            l.hitX = l.hitY = -99;
          } else {
            earn(stats.logoValue);
            floatText(l.x + LOGO_W / 2, l.y + LOGO_H / 2, `+${fmt(stats.logoValue)}`);
            sound.bounce();
          }
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.max) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (!p.text) p.vy += 520 * dt;
      }
      spin += dt * (reduceMotion ? 0.4 : bought.has('hyper') ? 5 : 3);

      g.clearRect(0, 0, W, H);
      if (bought.has('pinwheel')) {
        const r = small() ? 22 : 30;
        drawPinwheel(r + 8, H - r - 44, r, spin);
        drawPinwheel(W - r - 8, H - r - 44, r, -spin * 1.3);
        if (!small()) {
          drawPinwheel(r + 8, r + 50, r, spin * 0.8);
          drawPinwheel(W - r - 8, r + 50, r, -spin);
        }
      }
      for (const s of shapes) drawShape(s);
      for (const l of logos) drawLogo(l);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const p of particles) {
        const k = 1 - p.life / p.max;
        g.globalAlpha = Math.min(1, k * 1.6);
        if (p.text) {
          g.font = `900 ${p.size}px system-ui, sans-serif`;
          g.lineWidth = 4;
          g.strokeStyle = '#fffdf7';
          g.strokeText(p.text, p.x, p.y);
          g.fillStyle = p.color;
          g.fillText(p.text, p.x, p.y);
        } else {
          g.fillStyle = p.color;
          g.fillRect(p.x, p.y, p.size, p.size * 0.6);
        }
      }
      g.globalAlpha = 1;
    }

    // ---------- Persistence and HUD ----------
    function persist(): void {
      if (ended) return;
      setJSON(SAVE_KEY, { ...save, bought: [...bought] });
    }

    let hudT = 0;
    let shopT = 0;
    let saveT = 0;
    let stockT = 0;
    let tickerT = 0;
    let autoAcc = 0;
    function hud(): void {
      countEl.textContent = fmt(save.pts);
      const perSec = stats.sps + stats.auto * stats.spc;
      rateEl.textContent = `+${fmt(perSec)} per second`;
      timeEl.textContent = clock(save.ms);
    }

    let last = performance.now();
    function loop(now: number): void {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (ended) return;
      const started = save.clicks > 0 || save.ms > 0;
      if (started) {
        save.ms += dt * 1000;
        earn(stats.sps * dt);
        if (stats.auto) {
          autoAcc += stats.auto * dt;
          let n = 0;
          while (autoAcc >= 1 && n++ < 10) {
            autoAcc -= 1;
            doPress(false);
          }
        }
        if (bought.has('pings')) {
          pingTimer -= dt;
          if (pingTimer <= 0) {
            addPing();
            pingTimer = 7 + Math.random() * 6;
          }
        }
        if (bought.has('pinata')) {
          if (pinata.hidden) {
            pinataTimer -= dt;
            if (pinataTimer <= 0) {
              showPinata();
              pinataTimer = 22 + Math.random() * 14;
            }
          } else if ((pinataLife -= dt) <= 0) pinata.hidden = true;
        }
      }
      if (bought.has('dash')) stepDash(dt);
      step(dt);

      hudT -= dt;
      shopT -= dt;
      saveT -= dt;
      if (hudT <= 0) {
        hud();
        hudT = 0.07;
      }
      if (shopT <= 0) {
        renderShop();
        shopT = 0.25;
      }
      if (saveT <= 0 && started) {
        persist();
        saveT = 3;
      }
      if (bought.has('stonks') && (stockT -= dt) <= 0) {
        updateStocks();
        stockT = 1.4;
      }
      if (reduceMotion && bought.has('ticker') && (tickerT -= dt) <= 0) {
        tickerIndex = (tickerIndex + 1) % HEADLINES.length;
        tickerTrack.textContent = HEADLINES[tickerIndex];
        tickerT = 5;
      }
    }

    // ---------- Ending ----------
    function finish(): void {
      ended = true;
      cancelAnimationFrame(raf);
      pingsEl.replaceChildren();
      pinata.hidden = true;
      const seconds = Math.max(1, Math.round(save.ms / 1000));
      const { best, isNewBest } = saveBest(SLUG, seconds, true);
      setJSON(SAVE_KEY, null);
      sound.peace();
      shapes.length = 0;
      logos.length = 0;
      particles.length = 0;
      g.clearRect(0, 0, W, H);
      el.dataset.state = 'peace';
      const total = save.total;
      const clicks = save.clicks;
      const end = document.createElement('div');
      end.className = 'st-end';
      end.innerHTML = `
        <div class="st-calm" aria-hidden="true">
          <div class="st-sun"></div>
          <div class="st-sea"></div>
        </div>
        <div class="st-end-inner">
          <div class="st-breathe" aria-hidden="true"></div>
          <p class="st-end-line">Everything is quiet now.</p>
          <p class="st-end-sub">Breathe in. Breathe out.</p>
          <div class="st-end-result" data-result></div>
        </div>`;
      el.append(end);
      const showResult = () => {
        const host = end.querySelector<HTMLDivElement>('[data-result]')!;
        host.append(
          createResultPanel(root, {
            label: 'You found inner peace in',
            score: duration(seconds),
            message: `You earned ${fmt(total)} stimulation and clicked ${clicks.toLocaleString('en-US')} times along the way.`,
            best: duration(best),
            isNewBest,
            playAgainLabel: '🔁 Get overstimulated again',
            onPlayAgain: () => start(freshSave()),
          }),
        );
      };
      window.setTimeout(showResult, reduceMotion ? 0 : 2600);
    }

    // ---------- Controls ----------
    function renderMute(): void {
      const m = sound.isMuted();
      muteBtn.textContent = m ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', m ? 'Turn sound on' : 'Turn sound off');
      muteBtn.setAttribute('aria-pressed', String(m));
    }
    muteBtn.addEventListener(
      'click',
      () => {
        sound.setMuted(!sound.isMuted());
        if (!sound.isMuted() && bought.has('beat')) {
          gestured = true;
          sound.startBeat(bought.has('bass') ? 2 : 1);
        }
        renderMute();
      },
      sig,
    );

    let resetArmed = 0;
    resetBtn.addEventListener(
      'click',
      () => {
        if (resetArmed) {
          window.clearTimeout(resetArmed);
          setJSON(SAVE_KEY, null);
          start(freshSave());
          return;
        }
        resetBtn.textContent = 'Sure? Tap again';
        resetArmed = window.setTimeout(() => {
          resetArmed = 0;
          resetBtn.textContent = 'Start over';
        }, 3000);
      },
      sig,
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) persist();
        else last = performance.now();
        sound.setHidden(document.hidden);
      },
      sig,
    );
    window.addEventListener('pagehide', persist, sig);

    // ---------- Boot ----------
    resize();
    renderMute();
    for (const id of save.bought) applyVisual(id, false);
    hud();
    renderShop(true);
    raf = requestAnimationFrame((t) => {
      last = t;
      loop(t);
    });

    return () => {
      ended = true;
      cancelAnimationFrame(raf);
      off.abort();
      ro.disconnect();
      sound.stopBeat();
      if (resetArmed) window.clearTimeout(resetArmed);
      el.classList.remove('is-bass');
      el.replaceChildren();
    };
  }

  start(loadSave());
}
