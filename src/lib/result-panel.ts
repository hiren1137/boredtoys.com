import { buildShareRow, readContext } from './share';

export interface ResultOptions {
  /** Small label above the score, e.g. "Your circle". */
  label: string;
  /** Big score as displayed, e.g. "87.3%". */
  score: string;
  /** Value inserted into shareText's {score}; defaults to `score`. */
  shareScore?: string;
  message?: string;
  /** Personal best as displayed; omit to hide the line. */
  best?: string;
  isNewBest?: boolean;
  playAgainLabel?: string;
  onPlayAgain?: () => void;
  /** Extra content placed between the message and the buttons. */
  extra?: HTMLElement;
  /** Hide share buttons, e.g. for a failed attempt. */
  hideShare?: boolean;
  /** Move focus to the play-again button (default true). */
  autoFocus?: boolean;
}

/** Builds the shared, screenshot-friendly result card. */
export function createResultPanel(host: HTMLElement, opts: ResultOptions): HTMLElement {
  const ctx = readContext(host);
  const panel = document.createElement('section');
  panel.className = 'result-panel';
  panel.setAttribute('aria-live', 'polite');
  panel.setAttribute('aria-label', 'Your result');

  const brand = document.createElement('span');
  brand.className = 'result-brand';
  brand.textContent = ctx.siteName;

  const label = el('p', 'result-label', opts.label);
  const score = el('p', 'result-score', opts.score);
  panel.append(brand, label, score);

  if (opts.message) panel.append(el('p', 'result-message', opts.message));
  if (opts.best != null) {
    const best = el('p', 'result-best', `Your best: ${opts.best}`);
    if (opts.isNewBest) best.append(el('span', 'is-new', 'New best!'));
    panel.append(best);
  }
  if (opts.extra) panel.append(opts.extra);

  const actions = document.createElement('div');
  actions.className = 'result-actions';
  if (opts.onPlayAgain) {
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'btn btn--mint btn--big';
    again.textContent = opts.playAgainLabel ?? '🔁 Play again';
    again.addEventListener('click', () => opts.onPlayAgain?.());
    actions.append(again);
    if (opts.autoFocus !== false) queueMicrotask(() => again.focus({ preventScroll: true }));
  }
  panel.append(actions);

  if (!opts.hideShare) {
    const shareRow = buildShareRow(ctx, () => opts.shareScore ?? opts.score);
    shareRow.style.marginTop = '12px';
    panel.append(shareRow);
  }
  return panel;
}

function el(tag: string, className: string, text: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  e.textContent = text;
  return e;
}
