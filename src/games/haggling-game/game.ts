import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { CHARACTERS, FAKE_WALK, ITEMS, KIND_LABEL, LINES, RULES, type Character, type Item } from './data';
import { portrait, type Mood } from './art';
import { createSound } from './sound';

const SLUG = 'haggling-game';
const ROUNDS = 10;

interface Customer {
  c: Character;
  item: Item;
  max: number;
  offer: number;
  patience: number;
  start: number;
  faked: boolean;
  sold: number | null;
  done: boolean;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCustomers(): Customer[] {
  const people = shuffle(CHARACTERS).slice(0, ROUNDS);
  const items = shuffle(ITEMS).slice(0, ROUNDS);
  return people.map((c, i) => {
    const r = RULES[c.kind];
    const item = items[i];
    const max = Math.max(3, Math.round(item.value * rand(r.maxMin, r.maxMax)));
    const offer = Math.min(max - 1, Math.max(1, Math.round(max * rand(r.openMin, r.openMax))));
    return { c, item, max, offer, patience: r.patience, start: r.patience, faked: false, sold: null, done: false };
  });
}

const fill = (line: string, cu: Customer) =>
  line.replace('{item}', cu.item.name).replace('{offer}', usd(cu.offer));

function mood(cu: Customer): Mood {
  if (cu.done) return cu.sold != null ? 'happy' : 'angry';
  const k = cu.patience / cu.start;
  if (k >= 1) return 'happy';
  if (k > 0.6) return 'calm';
  if (k > 0.3) return 'annoyed';
  return 'angry';
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-haggle';
  root.append(el);
  const sound = createSound();

  let customers: Customer[] = [];
  let index = 0;
  let earned = 0;
  let refocus: 'input' | 'button' = 'button';

  function muteButton(): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hg-mute';
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
    el.dataset.state = 'start';
    const best = getBest(SLUG);
    const guests = shuffle(CHARACTERS).slice(0, 3);
    el.innerHTML = `
      <div class="hg-start">
        <div class="hg-lineup" aria-hidden="true">${guests.map((g) => portrait(g, 'happy')).join('')}</div>
        <p class="hg-kicker">10 customers. 1 very odd stall.</p>
        <p class="hg-big">Sell your weird junk for as much as you can.</p>
        <p>Every customer has a secret top price. Counter their offers to push them higher, but get too greedy and they storm off.</p>
        ${best != null ? `<p class="hg-best">Your best day: ${usd(best)}</p>` : ''}
        <button type="button" class="btn btn--big btn--mint" data-start>🛒 Open the stall</button>
      </div>`;
    el.querySelector('[data-start]')!.addEventListener('click', startRun);
  }

  function startRun(): void {
    customers = makeCustomers();
    index = 0;
    earned = 0;
    sound.bell();
    renderCustomer(fill(pick(LINES[customers[0].c.kind].greet), customers[0]), true);
  }

  function renderCustomer(line: string, entering = false): void {
    el.dataset.state = 'playing';
    const cu = customers[index];
    const step = Math.max(1, Math.round(cu.item.value * 0.05));
    const dots = Array.from({ length: cu.start }, (_, i) => `<i class="${i < cu.patience ? 'is-on' : ''}"></i>`).join('');
    el.innerHTML = `
      <div class="hg-top">
        <span class="hg-pill">Customer ${index + 1} of ${ROUNDS}</span>
        <span class="hg-pill hg-pill--cash">Earned ${usd(earned)}</span>
      </div>
      <div class="hg-scene">
        <div class="hg-who${entering ? ' is-entering' : ''}">
          <div class="hg-face">${portrait(cu.c, mood(cu))}</div>
          <p class="hg-name">${cu.c.name}</p>
          <p class="hg-kind">${KIND_LABEL[cu.c.kind]}</p>
          <p class="hg-patience" aria-label="Patience ${cu.patience} of ${cu.start}"><span>Patience</span>${dots}</p>
        </div>
        <div class="hg-talk">
          <p class="hg-bubble" aria-live="polite">${line}</p>
          <div class="hg-item">
            <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">${cu.item.icon}</svg>
            <p><small>They want</small>${cu.item.name}<small>Sticker price ${usd(cu.item.value)}</small></p>
          </div>
          <div class="hg-deal" data-deal></div>
        </div>
      </div>`;
    el.querySelector('.hg-top')!.append(muteButton());
    const deal = el.querySelector<HTMLDivElement>('[data-deal]')!;

    if (cu.done) {
      const ratio = cu.sold != null ? cu.sold / cu.max : 0;
      const verdict =
        cu.sold == null
          ? 'No sale.'
          : ratio >= 0.95
            ? 'Perfect squeeze!'
            : ratio >= 0.8
              ? 'Nice haggle.'
              : 'You left some money on the table.';
      deal.innerHTML = `
        <p class="hg-outcome ${cu.sold != null ? 'is-sold' : 'is-gone'}">
          <b>${cu.sold != null ? `Sold for ${usd(cu.sold)}!` : `${cu.c.name} walked away.`}</b>
          <span>Their secret max was ${usd(cu.max)}. ${verdict}</span>
        </p>
        <button type="button" class="btn btn--big btn--mint" data-next>${index + 1 < ROUNDS ? 'Next customer →' : 'Close the stall'}</button>`;
      const next = deal.querySelector<HTMLButtonElement>('[data-next]')!;
      next.addEventListener('click', () => {
        if (index + 1 >= ROUNDS) return finish();
        index++;
        sound.bell();
        renderCustomer(fill(pick(LINES[customers[index].c.kind].greet), customers[index]), true);
      });
      next.focus({ preventScroll: true });
      return;
    }

    deal.innerHTML = `
      <p class="hg-offer">Their offer <b>${usd(cu.offer)}</b></p>
      <form class="hg-form" novalidate>
        <label class="hg-label" for="hg-ask">Your price</label>
        <div class="hg-ask">
          <button type="button" class="hg-step" data-down aria-label="Lower your price by ${usd(step)}">−</button>
          <span class="hg-dollar" aria-hidden="true">$</span>
          <input id="hg-ask" type="number" inputmode="numeric" min="1" step="1" value="${Math.max(cu.offer + 1, cu.item.value)}" />
          <button type="button" class="hg-step" data-up aria-label="Raise your price by ${usd(step)}">+</button>
        </div>
        <div class="hg-actions">
          <button type="submit" class="btn btn--sky">Counter</button>
          <button type="button" class="btn btn--mint" data-accept>Accept ${usd(cu.offer)}</button>
        </div>
      </form>`;
    const form = deal.querySelector<HTMLFormElement>('form')!;
    const input = deal.querySelector<HTMLInputElement>('input')!;
    const nudge = (d: number) => {
      const v = Math.max(1, (Math.round(Number(input.value)) || 0) + d);
      input.value = String(v);
    };
    deal.querySelector('[data-down]')!.addEventListener('click', () => nudge(-step));
    deal.querySelector('[data-up]')!.addEventListener('click', () => nudge(step));
    deal.querySelector('[data-accept]')!.addEventListener('click', () => close(cu.offer));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      refocus = document.activeElement === input ? 'input' : 'button';
      const ask = Math.round(Number(input.value));
      if (!Number.isFinite(ask) || ask < 1) {
        input.focus();
        return;
      }
      counter(ask);
    });
    if (!entering && refocus === 'input') input.focus({ preventScroll: true });
    else form.querySelector<HTMLButtonElement>('[type="submit"]')!.focus({ preventScroll: true });
  }

  function close(price: number, line?: string): void {
    const cu = customers[index];
    cu.sold = price;
    cu.done = true;
    earned += price;
    sound.sale();
    renderCustomer(line ?? pick(LINES[cu.c.kind].accept));
  }

  function leave(): void {
    const cu = customers[index];
    cu.done = true;
    cu.patience = 0;
    sound.huff();
    renderCustomer(pick(LINES[cu.c.kind].walk));
  }

  function counter(ask: number): void {
    const cu = customers[index];
    const L = LINES[cu.c.kind];
    if (ask <= cu.offer) return close(ask, pick(L.cheap));
    if (ask <= cu.max) return close(ask);
    const greed = ask / cu.max;
    cu.patience -= greed > 1.5 ? 2 : 1;
    if (cu.patience <= 0) {
      if (cu.c.kind === 'bluffer' && !cu.faked && greed <= 1.5) {
        cu.faked = true;
        cu.patience = 1;
        sound.huff();
        return renderCustomer(pick(FAKE_WALK));
      }
      return leave();
    }
    const raise = (cu.max - cu.offer) * RULES[cu.c.kind].step;
    cu.offer = Math.min(cu.max - 1, Math.max(cu.offer + 1, Math.round(cu.offer + raise)));
    sound.blip();
    let pool = greed > 1.5 ? L.insulted : L.counter;
    if (cu.patience === 1 || (cu.c.kind === 'bluffer' && Math.random() < 0.5)) pool = L.final;
    renderCustomer(fill(pick(pool), cu));
  }

  function finish(): void {
    el.dataset.state = 'result';
    const sumMax = customers.reduce((s, cu) => s + cu.max, 0);
    const sales = customers.filter((cu) => cu.sold != null).length;
    const share = sumMax > 0 ? Math.round((earned / sumMax) * 100) : 0;
    const { best, isNewBest } = saveBest(SLUG, earned);
    const message =
      share >= 90
        ? `You squeezed out ${share}% of everything your customers would have paid. A true haggling legend.`
        : share >= 70
          ? `You made ${sales} sales and got ${share}% of the most your customers would have paid. Solid trading.`
          : share >= 45
            ? `You made ${sales} sales and got ${share}% of their secret max. Room to push a bit harder.`
            : `You made ${sales} sales and got ${share}% of their secret max. The junk is still mostly here.`;
    const extra = document.createElement('div');
    extra.className = 'hg-ledger';
    extra.innerHTML = `<p class="hg-ledger-title">Today's ledger</p><ul>${customers
      .map(
        (cu) =>
          `<li><span>${cu.c.name}</span><span>${cu.sold != null ? `<b>${usd(cu.sold)}</b> of ${usd(cu.max)}` : `walked (max ${usd(cu.max)})`}</span></li>`,
      )
      .join('')}</ul>`;
    const wrap = document.createElement('div');
    wrap.className = 'hg-result';
    wrap.append(
      createResultPanel(root, {
        label: 'Money earned today',
        score: usd(earned),
        message,
        best: usd(best),
        isNewBest,
        playAgainLabel: '🛒 Open the stall again',
        onPlayAgain: startRun,
        extra,
      }),
    );
    el.replaceChildren(wrap);
  }

  renderStart();
}
