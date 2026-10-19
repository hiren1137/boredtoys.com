import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { HEADLINES, ITEMS, NOTES } from './data';
import { createSound } from './sound';

const SLUG = 'money-printer-game';
const START_MONEY = 1e9;
const NOTES_PER_PRESS = 5e6;
const MONTHS = 12;
const MONTH_SECONDS = 5;
const PRINT_EVERY = 0.125;
const UNLOCK_RISE = 3;
const JAR = 500;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BIG = ['million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];

function money(n: number): string {
  if (!Number.isFinite(n)) return 'P$ too much to count';
  if (n < 100) return `P$${n.toFixed(2)}`;
  if (n < 1e6) return `P$${Math.round(n).toLocaleString('en-US')}`;
  const i = Math.floor(Math.log10(n) / 3) - 2;
  if (i >= BIG.length) return `P$${n.toExponential(2)}`;
  const v = n / 10 ** (3 * (i + 2));
  return `P$${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${BIG[i]}`;
}

function noteLabel(v: number): string {
  if (v < 1e6) return `P$${v.toLocaleString('en-US')}`;
  const i = Math.floor(Math.log10(v) / 3) - 2;
  return `P$${Math.round(v / 10 ** (3 * (i + 2)))} ${BIG[i]}`;
}

function times(level: number): string {
  if (level < 10) return `×${level.toFixed(2)}`;
  if (level < 1e6) return `×${Math.round(level).toLocaleString('en-US')}`;
  return `×${money(level).slice(2)}`;
}

function loaves(n: number): string {
  if (n >= 10) return Math.floor(n).toLocaleString('en-US');
  if (n >= 0.01) return n.toFixed(2);
  if (n >= 0.001) return n.toPrecision(1);
  return 'less than 0.001';
}

const PRINTER_SVG = `
<svg class="mp-printer-art" viewBox="0 0 220 150" width="220" height="150" aria-hidden="true">
  <g stroke="#1f1a2e" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    <rect x="40" y="10" width="140" height="40" rx="8" fill="#fffdf7"/>
    <rect x="14" y="44" width="192" height="80" rx="18" fill="#ffac57"/>
    <rect x="44" y="112" width="132" height="14" rx="5" fill="#1f1a2e"/>
    <circle cx="176" cy="70" r="10" fill="#6be3a8"/>
    <circle cx="176" cy="96" r="6" fill="#ff7466"/>
    <circle cx="70" cy="78" r="7" fill="#1f1a2e"/>
    <circle cx="112" cy="78" r="7" fill="#1f1a2e"/>
    <path d="M78 98c8 8 18 8 26 0" fill="none"/>
    <path d="M14 140h192" fill="none"/>
  </g>
</svg>`;

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-money';
  root.append(el);
  const sound = createSound();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stop: (() => void) | null = null;

  function muteButton(): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mp-mute';
    const paint = () => {
      const m = sound.isMuted();
      b.textContent = m ? '🔇' : '🔊';
      b.setAttribute('aria-label', m ? 'Turn sound on' : 'Turn sound off');
      b.setAttribute('aria-pressed', String(m));
    };
    b.addEventListener('click', () => {
      sound.setMuted(!sound.isMuted());
      paint();
    });
    paint();
    return b;
  }

  function renderStart(): void {
    stop?.();
    el.dataset.state = 'start';
    const best = getBest(SLUG);
    el.innerHTML = `
      <div class="mp-start">
        ${PRINTER_SVG}
        <p class="mp-kicker">One pretend year. One very big printer.</p>
        <p class="mp-big">You run the money printer of Pretendia.</p>
        <p>Print as much cash as you like for 12 months. Pretendia still makes the same amount of bread, shoes and bikes, so watch what happens to prices.</p>
        ${best != null ? `<p class="mp-best">Priciest bread you have caused: ${money(best)}</p>` : ''}
        <button type="button" class="btn btn--big btn--mint" data-start>🖨️ Start the year</button>
      </div>`;
    el.querySelector('[data-start]')!.addEventListener('click', play);
  }

  function play(): void {
    stop?.();
    el.dataset.state = 'playing';
    let M = START_MONEY;
    let lnP = 0;
    let noteIdx = 0;
    let noteLevel = 1;
    let elapsed = 0;
    let holding = false;
    let holdAcc = 0;
    let presses = 0;
    let raf = 0;
    let done = false;
    let headlineIdx = -1;
    let flying = 0;

    el.innerHTML = `
      <div class="mp-top">
        <div class="mp-month"><span data-month>Jan</span> <small>month <b data-month-n>1</b> of 12</small></div>
        <div class="mp-bar" aria-hidden="true"><i data-bar></i></div>
      </div>
      <div class="mp-grid">
        <section class="mp-left" aria-label="The printer">
          <div class="mp-stats">
            <p><small>Money in Pretendia</small><b data-supply></b></p>
            <p><small>You printed</small><b data-printed>P$0</b></p>
          </div>
          <div class="mp-printer">
            ${PRINTER_SVG}
            <div class="mp-bills" data-bills aria-hidden="true"></div>
          </div>
          <button type="button" class="mp-print" data-print>
            <span>Hold to print</span>
            <small data-note-label></small>
          </button>
          <div class="mp-note-row">
            <button type="button" class="btn btn--small btn--sky" data-bigger></button>
          </div>
          <p class="mp-hint" data-hint></p>
        </section>
        <section class="mp-right" aria-label="Prices in Pretendia">
          <p class="mp-news"><span class="mp-news-tag">Pretendia Daily</span> <span data-headline></span></p>
          <ul class="mp-items" data-items></ul>
          <div class="mp-jar">
            <svg viewBox="0 0 40 48" width="34" height="40" aria-hidden="true"><g stroke="#1f1a2e" stroke-width="3" stroke-linejoin="round"><rect x="8" y="2" width="24" height="8" rx="3" fill="#c7a3ff"/><path d="M6 12h28v28c0 4-3 6-6 6H12c-3 0-6-2-6-6z" fill="#eaf7ff"/><rect x="12" y="24" width="16" height="10" rx="2" fill="#6be3a8"/></g></svg>
            <p>Granny Ottoline saved <b>P$500</b> in a jar. It buys <b data-jar>200</b> loaves of bread.</p>
          </div>
          <p class="mp-model">Simplified model, not a forecast: Pretendia makes the same amount of stuff all year, so prices catch up with the amount of money. Real economies are much messier.</p>
        </section>
      </div>
      <p class="visually-hidden" aria-live="polite" data-announce></p>`;

    const $ = <T extends Element>(s: string) => el.querySelector(s) as T;
    el.querySelector('.mp-top')!.append(muteButton());
    const monthEl = $<HTMLSpanElement>('[data-month]');
    const monthN = $<HTMLElement>('[data-month-n]');
    const bar = $<HTMLElement>('[data-bar]');
    const supplyEl = $<HTMLElement>('[data-supply]');
    const printedEl = $<HTMLElement>('[data-printed]');
    const bills = $<HTMLDivElement>('[data-bills]');
    const printBtn = $<HTMLButtonElement>('[data-print]');
    const noteLabelEl = $<HTMLElement>('[data-note-label]');
    const bigger = $<HTMLButtonElement>('[data-bigger]');
    const hint = $<HTMLElement>('[data-hint]');
    const headline = $<HTMLElement>('[data-headline]');
    const itemsEl = $<HTMLUListElement>('[data-items]');
    const jar = $<HTMLElement>('[data-jar]');
    const announce = $<HTMLElement>('[data-announce]');

    itemsEl.innerHTML = ITEMS.map(
      (it) => `<li class="mp-item" data-item="${it.id}">
        <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">${it.icon}</svg>
        <span class="mp-item-name">${it.name}</span>
        <b class="mp-item-price" data-price></b>
        <small class="mp-item-was">was ${money(it.base)}</small>
      </li>`,
    ).join('');
    const priceEls = ITEMS.map((it) => itemsEl.querySelector<HTMLElement>(`[data-item="${it.id}"] [data-price]`)!);
    const itemEls = ITEMS.map((it) => itemsEl.querySelector<HTMLElement>(`[data-item="${it.id}"]`)!);
    let shown = ITEMS.map((it) => it.base);

    const level = () => Math.exp(lnP);
    const canBigger = () => noteIdx < NOTES.length - 1 && level() >= noteLevel * UNLOCK_RISE;

    function renderNote(): void {
      noteLabelEl.textContent = `${noteLabel(NOTES[noteIdx])} notes`;
      if (noteIdx >= NOTES.length - 1) {
        bigger.disabled = true;
        bigger.textContent = 'Biggest note ever designed';
        hint.textContent = 'You reached the P$100 trillion note. Keep printing!';
        return;
      }
      const next = noteLabel(NOTES[noteIdx + 1]);
      bigger.textContent = `✏️ Design a ${next} note`;
      bigger.disabled = !canBigger();
      hint.textContent = bigger.disabled
        ? `Shops will accept a ${next} note once prices triple again.`
        : `Prices tripled. Shops are ready for a ${next} note.`;
    }

    function printOnce(): void {
      if (done) return;
      M += NOTES[noteIdx] * NOTES_PER_PRESS;
      presses++;
      sound.print();
      if (!reduceMotion && flying < 18) {
        flying++;
        const b = document.createElement('span');
        b.className = 'mp-bill';
        b.textContent = noteLabel(NOTES[noteIdx]).replace('P$', '');
        b.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 220)}px`);
        b.style.setProperty('--r', `${Math.round((Math.random() - 0.5) * 90)}deg`);
        b.addEventListener('animationend', () => {
          b.remove();
          flying--;
        });
        bills.append(b);
      }
    }

    function startHold(): void {
      if (done || holding) return;
      holding = true;
      holdAcc = 0;
      printBtn.classList.add('is-down');
      printOnce();
    }
    function endHold(): void {
      holding = false;
      printBtn.classList.remove('is-down');
    }

    printBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      printBtn.setPointerCapture?.(e.pointerId);
      startHold();
    });
    printBtn.addEventListener('pointerup', endHold);
    printBtn.addEventListener('pointercancel', endHold);
    printBtn.addEventListener('lostpointercapture', endHold);
    printBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    printBtn.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!e.repeat) startHold();
    });
    printBtn.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') endHold();
    });
    printBtn.addEventListener('blur', endHold);

    bigger.addEventListener('click', () => {
      if (!canBigger()) return;
      noteIdx++;
      noteLevel = level();
      sound.newNote();
      announce.textContent = `New ${noteLabel(NOTES[noteIdx])} note designed.`;
      renderNote();
      printBtn.focus({ preventScroll: true });
    });

    const onVis = () => {
      if (document.hidden) endHold();
    };
    document.addEventListener('visibilitychange', onVis);

    let uiT = 0;
    let last = performance.now();
    function frame(now: number): void {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (done) return;
      elapsed += dt;
      if (holding) {
        holdAcc += dt;
        while (holdAcc >= PRINT_EVERY) {
          holdAcc -= PRINT_EVERY;
          printOnce();
        }
      }
      const target = Math.log(M / START_MONEY);
      lnP += (target - lnP) * (1 - Math.exp(-dt / 0.7));
      if (elapsed >= MONTHS * MONTH_SECONDS) {
        lnP = target;
        finish();
        return;
      }
      uiT -= dt;
      if (uiT <= 0) {
        uiT = 0.08;
        ui();
      }
    }

    function ui(): void {
      const m = Math.min(MONTHS - 1, Math.floor(elapsed / MONTH_SECONDS));
      monthEl.textContent = MONTH_NAMES[m];
      monthN.textContent = String(m + 1);
      bar.style.transform = `scaleX(${Math.min(1, elapsed / (MONTHS * MONTH_SECONDS))})`;
      supplyEl.textContent = money(M);
      printedEl.textContent = money(M - START_MONEY);
      const lv = level();
      ITEMS.forEach((it, i) => {
        const p = it.base * lv;
        const rising = p > shown[i] * 1.0005;
        shown[i] = p;
        priceEls[i].textContent = money(p);
        itemEls[i].classList.toggle('is-rising', rising);
      });
      jar.textContent = loaves(JAR / (ITEMS[0].base * lv));
      let h = 0;
      for (let i = 0; i < HEADLINES.length; i++) if (lv >= HEADLINES[i][0]) h = i;
      if (h !== headlineIdx) {
        headlineIdx = h;
        headline.textContent = HEADLINES[h][1];
      }
      const ready = canBigger();
      if (ready === bigger.disabled && noteIdx < NOTES.length - 1) renderNote();
    }

    function finish(): void {
      done = true;
      endHold();
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      sound.end();
      const lv = level();
      const bread = ITEMS[0].base * lv;
      const printed = M - START_MONEY;
      const { best, isNewBest } = saveBest(SLUG, bread);
      el.dataset.state = 'result';
      const extra = document.createElement('div');
      extra.className = 'mp-receipt';
      extra.innerHTML = `
        <p class="mp-receipt-title">Pretendia price tags, January vs December</p>
        <ul>${ITEMS.map((it) => `<li><span>${it.name}</span><span>${money(it.base)} → <b>${money(it.base * lv)}</b></span></li>`).join('')}</ul>`;
      const message =
        presses === 0
          ? 'You printed nothing, so prices stayed exactly the same. Very responsible. Very boring.'
          : `You printed ${money(printed)} and prices went up ${times(lv)} in one pretend year. Granny's P$500 jar now buys ${loaves(JAR / bread)} loaves.`;
      const wrap = document.createElement('div');
      wrap.className = 'mp-result';
      wrap.append(
        createResultPanel(root, {
          label: 'A loaf of bread now costs',
          score: money(bread),
          message,
          best: money(best),
          isNewBest: isNewBest && presses > 0,
          playAgainLabel: '🖨️ Print another year',
          onPlayAgain: play,
          extra,
        }),
      );
      el.replaceChildren(wrap);
    }

    stop = () => {
      done = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };

    renderNote();
    ui();
    printBtn.focus({ preventScroll: true });
    raf = requestAnimationFrame((t) => {
      last = t;
      frame(t);
    });
  }

  renderStart();
}
