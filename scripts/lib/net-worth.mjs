import { join } from 'node:path';
import { ROOT } from './games.mjs';

export const NET_WORTH_FILE = join(ROOT, 'src/data/spend/net-worth.json');

/** Rounds to the precision shown in copy, so the game counter and the text agree. */
export function roundWorth(dollars) {
  const unit = dollars >= 1e12 ? 1e10 : 1e8;
  return Math.round(dollars / unit) * unit;
}

const trim = (n, digits) => n.toFixed(digits).replace(/\.?0+$/, '');

/** "$117.8 billion" / "$1.02 trillion" */
export function formatLong(dollars) {
  return dollars >= 1e12 ? `$${trim(dollars / 1e12, 2)} trillion` : `$${trim(dollars / 1e9, 1)} billion`;
}

/** "$117.8B" / "$1.02T" */
export function formatShort(dollars) {
  return dollars >= 1e12 ? `$${trim(dollars / 1e12, 2)}T` : `$${trim(dollars / 1e9, 1)}B`;
}

/** "October 17, 2026" */
export function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
