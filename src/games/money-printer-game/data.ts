export interface Item {
  id: string;
  name: string;
  base: number;
  icon: string;
}

const S = 'stroke="#1f1a2e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

export const ITEMS: Item[] = [
  {
    id: 'bread',
    name: 'Loaf of bread',
    base: 2.5,
    icon: `<path ${S} d="M8 22c0-8 7-12 16-12s16 4 16 12v14H8z" fill="#ffac57"/><path ${S} d="M16 18l4 6M24 16l4 7M32 18l3 5" fill="none"/>`,
  },
  {
    id: 'icecream',
    name: 'Ice cream cone',
    base: 3,
    icon: `<path ${S} d="M16 22l8 20 8-20z" fill="#ffd447"/><circle ${S} cx="24" cy="16" r="10" fill="#ffa3d1"/>`,
  },
  {
    id: 'bus',
    name: 'Bus ticket',
    base: 2,
    icon: `<rect ${S} x="6" y="14" width="36" height="22" rx="4" fill="#6cc8ff"/><path ${S} d="M30 14v22" stroke-dasharray="3 4" fill="none"/><path ${S} d="M12 22h12M12 28h8" fill="none"/>`,
  },
  {
    id: 'sneakers',
    name: 'Pair of sneakers',
    base: 80,
    icon: `<path ${S} d="M6 34V20l10 2 6 6 18 3c3 1 4 3 4 6v1H6z" fill="#c7a3ff"/><path ${S} d="M6 34h38" fill="none"/><path ${S} d="M16 26l3-3M20 29l3-3" fill="none"/>`,
  },
  {
    id: 'bike',
    name: 'Bicycle',
    base: 300,
    icon: `<circle ${S} cx="12" cy="32" r="8" fill="#fff"/><circle ${S} cx="36" cy="32" r="8" fill="#fff"/><path ${S} d="M12 32l8-14h12l4 14M20 18l6 14h-14M30 12h6" fill="none"/>`,
  },
  {
    id: 'rent',
    name: 'Monthly rent',
    base: 1200,
    icon: `<path ${S} d="M8 22L24 8l16 14v18H8z" fill="#6be3a8"/><rect ${S} x="20" y="28" width="8" height="12" fill="#fff"/>`,
  },
];

/** Headlines keyed by how many times higher prices are than at the start. */
export const HEADLINES: [number, string][] = [
  [1, 'All calm in Pretendia. Bread is boring, as it should be.'],
  [1.1, 'Shopkeepers notice a little extra cash going around.'],
  [1.5, 'Prices creep up. Nobody panics. Yet.'],
  [2, 'Bread now costs double. Toast fans are worried.'],
  [5, 'Shops start changing price tags twice a day.'],
  [10, 'Wallets are out. Backpacks full of cash are in.'],
  [100, 'Cafe asks customers to pay before eating, in case prices change.'],
  [1e3, 'Kids build pillow forts out of P$100 notes.'],
  [1e4, 'Wheelbarrow sales boom. Wheelbarrows now cost a fortune too.'],
  [1e6, 'Bakery hires a full-time price tag painter.'],
  [1e9, 'Pretendia money is now worth less than the paper it is printed on.'],
  [1e12, 'Neighbor country kindly offers to lend us some real money.'],
];

export const NOTES = [10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14];
