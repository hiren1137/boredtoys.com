import './engine.css';
import { getJSON, saveBest, setJSON } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { iconSvg } from './icons';
import type { SpendData, SpendItem } from './types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function formatShort(n: number): string {
  const units: [number, string][] = [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
  ];
  for (const [v, word] of units) {
    if (n >= v) return `$${(n / v).toFixed(n / v >= 100 ? 0 : 1).replace(/\.0$/, '')} ${word}`;
  }
  return usd.format(n);
}

export function mountSpend(root: HTMLElement, data: SpendData): void {
  const items = [...data.items].sort((a, b) => a.price - b.price);
  const cartKey = `cart:${data.slug}`;
  const saved = getJSON<Record<string, number>>(cartKey, {});
  const qty = new Map<string, number>(items.map((it) => [it.id, Math.max(0, Math.floor(Number(saved[it.id]) || 0))]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const spentNow = () => items.reduce((s, it) => s + it.price * (qty.get(it.id) ?? 0), 0);
  // Drop a saved cart that no longer fits (e.g. the net worth figure was updated).
  if (spentNow() > data.netWorth) items.forEach((it) => qty.set(it.id, 0));

  const el = document.createElement('div');
  el.className = 'g-spend';
  el.innerHTML = `
    <div class="sp-bar">
      <p class="sp-left"><span class="sp-money" data-money></span></p>
      <div class="sp-meter" aria-hidden="true"><span data-meter></span></div>
      <p class="sp-meta" data-meta></p>
    </div>
    <ul class="sp-grid" data-grid></ul>
    <section class="sp-receipt" data-receipt aria-labelledby="sp-receipt-title" hidden>
      <div class="sp-paper">
        <h2 id="sp-receipt-title" class="sp-receipt-title">Your Receipt</h2>
        <ul class="sp-lines" data-lines></ul>
        <p class="sp-total"><span>Total</span><span data-total></span></p>
      </div>
      <div data-result></div>
    </section>
    <p class="visually-hidden" aria-live="polite" data-status></p>`;
  root.append(el);

  const $ = <T extends Element>(sel: string) => el.querySelector(sel) as T;
  const moneyEl = $<HTMLElement>('[data-money]');
  const meterEl = $<HTMLElement>('[data-meter]');
  const metaEl = $<HTMLElement>('[data-meta]');
  const grid = $<HTMLUListElement>('[data-grid]');
  const receipt = $<HTMLElement>('[data-receipt]');
  const lines = $<HTMLUListElement>('[data-lines]');
  const totalEl = $<HTMLElement>('[data-total]');
  const resultEl = $<HTMLElement>('[data-result]');
  const status = $<HTMLElement>('[data-status]');

  interface Row {
    item: SpendItem;
    sell: HTMLButtonElement;
    buy: HTMLButtonElement;
    input: HTMLInputElement;
    li: HTMLLIElement;
  }
  const rows: Row[] = items.map((item) => {
    const li = document.createElement('li');
    li.className = 'sp-item';
    li.innerHTML = `
      <div class="sp-icon">${iconSvg(item.icon)}</div>
      <p class="sp-name">${item.name}</p>
      ${item.note ? `<p class="sp-note">${item.note}</p>` : ''}
      <p class="sp-price">${usd.format(item.price)}</p>
      <div class="sp-controls">
        <button type="button" class="btn btn--small btn--tomato sp-sell" aria-label="Sell one ${item.name}">Sell</button>
        <input class="sp-qty" type="number" inputmode="numeric" min="0" step="1" value="0" aria-label="How many ${item.name}" />
        <button type="button" class="btn btn--small btn--mint sp-buy" aria-label="Buy one ${item.name}">Buy</button>
      </div>`;
    grid.append(li);
    return {
      item,
      li,
      sell: li.querySelector('.sp-sell') as HTMLButtonElement,
      buy: li.querySelector('.sp-buy') as HTMLButtonElement,
      input: li.querySelector('.sp-qty') as HTMLInputElement,
    };
  });

  let shown = data.netWorth - spentNow();
  let raf = 0;
  let receiptTimer = 0;

  function animateMoney(target: number): void {
    cancelAnimationFrame(raf);
    if (reduceMotion) {
      shown = target;
      moneyEl.textContent = usd.format(target);
      return;
    }
    const from = shown;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 350);
      const eased = 1 - Math.pow(1 - k, 3);
      shown = from + (target - from) * eased;
      moneyEl.textContent = usd.format(Math.round(shown));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function setQty(row: Row, next: number): void {
    const current = qty.get(row.item.id) ?? 0;
    const left = data.netWorth - spentNow();
    const max = current + Math.floor(left / row.item.price);
    const clamped = Math.max(0, Math.min(Math.floor(next) || 0, max));
    if (next > max) {
      row.li.classList.remove('is-broke');
      void row.li.offsetWidth;
      row.li.classList.add('is-broke');
      status.textContent = `Not enough money left for that many ${row.item.name}.`;
    }
    qty.set(row.item.id, clamped);
    setJSON(cartKey, Object.fromEntries(qty));
    update();
  }

  function update(): void {
    const spent = spentNow();
    const left = data.netWorth - spent;
    animateMoney(left);
    const pct = (spent / data.netWorth) * 100;
    meterEl.style.width = `${Math.min(100, pct)}%`;
    metaEl.textContent =
      spent > 0 ? `You spent ${formatShort(spent)} (${pct < 0.001 && pct > 0 ? 'less than 0.001' : pct.toFixed(pct < 1 ? 3 : 1)}%)` : `Start shopping! You have ${formatShort(data.netWorth)} to spend.`;
    for (const r of rows) {
      const q = qty.get(r.item.id) ?? 0;
      if (document.activeElement !== r.input) r.input.value = String(q);
      r.sell.disabled = q === 0;
      r.buy.disabled = r.item.price > left;
      r.li.classList.toggle('is-owned', q > 0);
    }
    window.clearTimeout(receiptTimer);
    receiptTimer = window.setTimeout(renderReceipt, 120);
  }

  function renderReceipt(): void {
    const spent = spentNow();
    receipt.hidden = spent === 0;
    if (spent === 0) {
      resultEl.replaceChildren();
      return;
    }
    lines.replaceChildren(
      ...rows
        .filter((r) => (qty.get(r.item.id) ?? 0) > 0)
        .map((r) => {
          const q = qty.get(r.item.id) ?? 0;
          const li = document.createElement('li');
          li.innerHTML = `<span>${r.item.name} <b>×${q.toLocaleString('en-US')}</b></span><span>${usd.format(q * r.item.price)}</span>`;
          return li;
        }),
    );
    totalEl.textContent = usd.format(spent);
    const left = data.netWorth - spent;
    const { best, isNewBest } = saveBest(data.slug, spent);
    const cheapest = items[0]?.price ?? 1;
    const message =
      left < cheapest
        ? `You spent every last dollar of ${data.possessive} money. Impressive!`
        : `${formatShort(left)} is still left. Keep shopping!`;
    resultEl.replaceChildren(
      createResultPanel(root, {
        label: `You spent from ${data.possessive} fortune`,
        score: formatShort(spent),
        message,
        best: formatShort(best),
        isNewBest,
        playAgainLabel: '🧾 Start over',
        onPlayAgain: () => {
          items.forEach((it) => qty.set(it.id, 0));
          setJSON(cartKey, {});
          update();
          el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        },
        autoFocus: false,
      }),
    );
  }

  for (const r of rows) {
    r.buy.addEventListener('click', () => setQty(r, (qty.get(r.item.id) ?? 0) + 1));
    r.sell.addEventListener('click', () => setQty(r, (qty.get(r.item.id) ?? 0) - 1));
    r.input.addEventListener('input', () => {
      if (r.input.value === '') return;
      setQty(r, Number(r.input.value));
    });
    r.input.addEventListener('change', () => {
      setQty(r, Number(r.input.value));
      r.input.value = String(qty.get(r.item.id) ?? 0);
    });
    r.input.addEventListener('focus', () => r.input.select());
  }

  moneyEl.textContent = usd.format(shown);
  update();
}
