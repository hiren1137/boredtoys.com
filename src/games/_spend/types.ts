import type { IconKey } from './icons';

export interface SpendItem {
  id: string;
  name: string;
  /** Price in US dollars. */
  price: number;
  icon: IconKey;
  /** Optional short note shown under the name, e.g. "hoped-for price". */
  note?: string;
}

export interface SpendData {
  slug: string;
  /** Full name, e.g. "Bill Gates". */
  person: string;
  /** Possessive used in UI copy, e.g. "Bill's". */
  possessive: string;
  /** Net worth in US dollars. */
  netWorth: number;
  /** ISO date the net worth figure refers to. */
  asOf: string;
  sourceName: string;
  sourceUrl: string;
  items: SpendItem[];
}
