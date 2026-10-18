import raw from './net-worth.json';

export interface NetWorthEntry {
  /** Forbes profile slug, e.g. "elon-musk". */
  forbesUri: string;
  /** Net worth in US dollars, rounded to match the page copy. */
  netWorth: number;
  /** ISO date of the Forbes figure. */
  asOf: string;
}

const entries = raw as Record<string, NetWorthEntry>;

/** Net worth for a spend game, kept fresh by `npm run update-net-worth`. */
export function netWorthFor(slug: string): Pick<NetWorthEntry, 'netWorth' | 'asOf'> {
  const entry = entries[slug];
  if (!entry) throw new Error(`No net worth entry for "${slug}" in src/data/spend/net-worth.json`);
  return { netWorth: entry.netWorth, asOf: entry.asOf };
}
