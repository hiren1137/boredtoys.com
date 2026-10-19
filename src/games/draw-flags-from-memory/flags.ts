/** The paint pots the player gets. Flags name their regions with these keys. */
export const PALETTE = {
  white: '#ffffff',
  black: '#111111',
  red: '#d7141a',
  orange: '#ff8a1f',
  yellow: '#ffd21f',
  green: '#079a49',
  blue: '#1f4fbf',
} as const;
export type Key = keyof typeof PALETTE;
export const KEYS = Object.keys(PALETTE) as Key[];

type Paint = (k: Key) => string;
type Draw = (c: CanvasRenderingContext2D, w: number, h: number, p: Paint) => void;

export interface Flag {
  id: string;
  country: string;
  /** Height divided by width, from the official proportions. */
  ratio: number;
  /** Official colours used when showing the real flag. */
  colors: Partial<Record<Key, string>>;
  draw: Draw;
}

function hBands(c: CanvasRenderingContext2D, w: number, h: number, fills: string[], weights?: number[]): void {
  const ws = weights ?? fills.map(() => 1);
  const total = ws.reduce((a, b) => a + b, 0);
  let y = 0;
  fills.forEach((f, i) => {
    const bh = (ws[i] / total) * h;
    c.fillStyle = f;
    c.fillRect(0, Math.floor(y), w, Math.ceil(bh) + 1);
    y += bh;
  });
}

function vBands(c: CanvasRenderingContext2D, w: number, h: number, fills: string[]): void {
  fills.forEach((f, i) => {
    c.fillStyle = f;
    c.fillRect(Math.floor((i * w) / fills.length), 0, Math.ceil(w / fills.length) + 1, h);
  });
}

/** Scandinavian cross. `xs`/`ys` are the band widths along each axis, e.g. Denmark 12:4:21 by 12:4:12. */
function nordic(c: CanvasRenderingContext2D, w: number, h: number, bg: string, crosses: { fill: string; xs: number[]; ys: number[] }[]): void {
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  for (const cr of crosses) {
    const tx = cr.xs.reduce((a, b) => a + b, 0);
    const ty = cr.ys.reduce((a, b) => a + b, 0);
    const x0 = (cr.xs[0] / tx) * w;
    const x1 = ((cr.xs[0] + cr.xs[1]) / tx) * w;
    const y0 = (cr.ys[0] / ty) * h;
    const y1 = ((cr.ys[0] + cr.ys[1]) / ty) * h;
    c.fillStyle = cr.fill;
    c.fillRect(x0, 0, x1 - x0, h);
    c.fillRect(0, y0, w, y1 - y0);
  }
}

function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function star(c: CanvasRenderingContext2D, x: number, y: number, outer: number, fill: string): void {
  const inner = outer * 0.381966;
  c.fillStyle = fill;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
  }
  c.closePath();
  c.fill();
}

// Right half of a stylised 11-point maple leaf, in units of the flag height, centred on (0, 0).
const LEAF: [number, number][] = [
  [0, -0.42],
  [0.04, -0.33],
  [0.095, -0.355],
  [0.075, -0.18],
  [0.17, -0.235],
  [0.195, -0.18],
  [0.35, -0.255],
  [0.3, -0.1],
  [0.355, -0.06],
  [0.18, 0.055],
  [0.25, 0.14],
  [0.035, 0.12],
  [0.025, 0.37],
];

function mapleLeaf(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  for (const [x, y] of LEAF) c.lineTo(cx + x * s, cy + y * s);
  for (let i = LEAF.length - 1; i >= 0; i--) c.lineTo(cx - LEAF[i][0] * s, cy + LEAF[i][1] * s);
  c.closePath();
  c.fill();
}

function chakra(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  c.strokeStyle = fill;
  c.fillStyle = fill;
  c.lineWidth = r * 0.12;
  c.beginPath();
  c.arc(x, y, r * 0.94, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = r * 0.05;
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
  }
  c.stroke();
  disc(c, x, y, r * 0.18, fill);
}

export const FLAGS: Flag[] = [
  {
    id: 'japan',
    country: 'Japan',
    ratio: 2 / 3,
    colors: { white: '#ffffff', red: '#bc002d' },
    draw: (c, w, h, p) => {
      c.fillStyle = p('white');
      c.fillRect(0, 0, w, h);
      disc(c, w / 2, h / 2, h * 0.3, p('red'));
    },
  },
  {
    id: 'france',
    country: 'France',
    ratio: 2 / 3,
    colors: { blue: '#002395', white: '#ffffff', red: '#ed2939' },
    draw: (c, w, h, p) => vBands(c, w, h, [p('blue'), p('white'), p('red')]),
  },
  {
    id: 'italy',
    country: 'Italy',
    ratio: 2 / 3,
    colors: { green: '#009246', white: '#ffffff', red: '#ce2b37' },
    draw: (c, w, h, p) => vBands(c, w, h, [p('green'), p('white'), p('red')]),
  },
  {
    id: 'germany',
    country: 'Germany',
    ratio: 3 / 5,
    colors: { black: '#000000', red: '#dd0000', yellow: '#ffce00' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('black'), p('red'), p('yellow')]),
  },
  {
    id: 'ukraine',
    country: 'Ukraine',
    ratio: 2 / 3,
    colors: { blue: '#0057b7', yellow: '#ffd700' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('blue'), p('yellow')]),
  },
  {
    id: 'sweden',
    country: 'Sweden',
    ratio: 10 / 16,
    colors: { blue: '#006aa7', yellow: '#fecc00' },
    draw: (c, w, h, p) => nordic(c, w, h, p('blue'), [{ fill: p('yellow'), xs: [5, 2, 9], ys: [4, 2, 4] }]),
  },
  {
    id: 'switzerland',
    country: 'Switzerland',
    ratio: 1,
    colors: { red: '#da291c', white: '#ffffff' },
    draw: (c, w, h, p) => {
      c.fillStyle = p('red');
      c.fillRect(0, 0, w, h);
      const u = w / 32;
      c.fillStyle = p('white');
      c.fillRect(13 * u, 6 * u, 6 * u, 20 * u);
      c.fillRect(6 * u, 13 * u, 20 * u, 6 * u);
    },
  },
  {
    id: 'canada',
    country: 'Canada',
    ratio: 1 / 2,
    colors: { red: '#d52b1e', white: '#ffffff' },
    draw: (c, w, h, p) => {
      vBands(c, w, h, [p('red'), p('white'), p('white'), p('red')]);
      mapleLeaf(c, w / 2, h / 2, h, p('red'));
    },
  },
  {
    id: 'india',
    country: 'India',
    ratio: 2 / 3,
    colors: { orange: '#ff9933', white: '#ffffff', green: '#138808', blue: '#000080' },
    draw: (c, w, h, p) => {
      hBands(c, w, h, [p('orange'), p('white'), p('green')]);
      chakra(c, w / 2, h / 2, (h / 3) * 0.4, p('blue'));
    },
  },
  {
    id: 'bangladesh',
    country: 'Bangladesh',
    ratio: 3 / 5,
    colors: { green: '#006a4e', red: '#f42a41' },
    draw: (c, w, h, p) => {
      c.fillStyle = p('green');
      c.fillRect(0, 0, w, h);
      disc(c, w * 0.45, h / 2, w * 0.2, p('red'));
    },
  },
  {
    id: 'greece',
    country: 'Greece',
    ratio: 2 / 3,
    colors: { blue: '#0d5eaf', white: '#ffffff' },
    draw: (c, w, h, p) => {
      hBands(c, w, h, [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (i % 2 ? p('white') : p('blue'))));
      const s = h / 9;
      c.fillStyle = p('blue');
      c.fillRect(0, 0, 5 * s, 5 * s);
      c.fillStyle = p('white');
      c.fillRect(0, 2 * s, 5 * s, s);
      c.fillRect(2 * s, 0, s, 5 * s);
    },
  },
  {
    id: 'jamaica',
    country: 'Jamaica',
    ratio: 1 / 2,
    colors: { green: '#009b3a', black: '#000000', yellow: '#fed100' },
    draw: (c, w, h, p) => {
      c.fillStyle = p('green');
      c.fillRect(0, 0, w, h);
      c.fillStyle = p('black');
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(w / 2, h / 2);
      c.lineTo(0, h);
      c.moveTo(w, 0);
      c.lineTo(w / 2, h / 2);
      c.lineTo(w, h);
      c.fill();
      c.strokeStyle = p('yellow');
      c.lineWidth = h / 6;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(w, h);
      c.moveTo(w, 0);
      c.lineTo(0, h);
      c.stroke();
    },
  },
  {
    id: 'poland',
    country: 'Poland',
    ratio: 5 / 8,
    colors: { white: '#ffffff', red: '#dc143c' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('white'), p('red')]),
  },
  {
    id: 'ireland',
    country: 'Ireland',
    ratio: 1 / 2,
    colors: { green: '#169b62', white: '#ffffff', orange: '#ff883e' },
    draw: (c, w, h, p) => vBands(c, w, h, [p('green'), p('white'), p('orange')]),
  },
  {
    id: 'belgium',
    country: 'Belgium',
    ratio: 13 / 15,
    colors: { black: '#000000', yellow: '#fdda24', red: '#ef3340' },
    draw: (c, w, h, p) => vBands(c, w, h, [p('black'), p('yellow'), p('red')]),
  },
  {
    id: 'nigeria',
    country: 'Nigeria',
    ratio: 1 / 2,
    colors: { green: '#008751', white: '#ffffff' },
    draw: (c, w, h, p) => vBands(c, w, h, [p('green'), p('white'), p('green')]),
  },
  {
    id: 'finland',
    country: 'Finland',
    ratio: 11 / 18,
    colors: { white: '#ffffff', blue: '#002f6c' },
    draw: (c, w, h, p) => nordic(c, w, h, p('white'), [{ fill: p('blue'), xs: [5, 3, 10], ys: [4, 3, 4] }]),
  },
  {
    id: 'denmark',
    country: 'Denmark',
    ratio: 28 / 37,
    colors: { red: '#c8102e', white: '#ffffff' },
    draw: (c, w, h, p) => nordic(c, w, h, p('red'), [{ fill: p('white'), xs: [12, 4, 21], ys: [12, 4, 12] }]),
  },
  {
    id: 'norway',
    country: 'Norway',
    ratio: 16 / 22,
    colors: { red: '#ba0c2f', white: '#ffffff', blue: '#00205b' },
    draw: (c, w, h, p) =>
      nordic(c, w, h, p('red'), [
        { fill: p('white'), xs: [6, 4, 12], ys: [6, 4, 6] },
        { fill: p('blue'), xs: [7, 2, 13], ys: [7, 2, 7] },
      ]),
  },
  {
    id: 'netherlands',
    country: 'the Netherlands',
    ratio: 2 / 3,
    colors: { red: '#ae1c28', white: '#ffffff', blue: '#21468b' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('red'), p('white'), p('blue')]),
  },
  {
    id: 'colombia',
    country: 'Colombia',
    ratio: 2 / 3,
    colors: { yellow: '#fcd116', blue: '#003893', red: '#ce1126' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('yellow'), p('blue'), p('red')], [2, 1, 1]),
  },
  {
    id: 'thailand',
    country: 'Thailand',
    ratio: 2 / 3,
    colors: { red: '#a51931', white: '#f4f5f8', blue: '#2d2a4a' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('red'), p('white'), p('blue'), p('white'), p('red')], [1, 1, 2, 1, 1]),
  },
  {
    id: 'vietnam',
    country: 'Vietnam',
    ratio: 2 / 3,
    colors: { red: '#da251d', yellow: '#ffff00' },
    draw: (c, w, h, p) => {
      c.fillStyle = p('red');
      c.fillRect(0, 0, w, h);
      star(c, w / 2, h / 2, w / 5, p('yellow'));
    },
  },
  {
    id: 'austria',
    country: 'Austria',
    ratio: 2 / 3,
    colors: { red: '#ed2939', white: '#ffffff' },
    draw: (c, w, h, p) => hBands(c, w, h, [p('red'), p('white'), p('red')]),
  },
];

/** Paints a flag in its official colours, or in the plain palette colours that scoring compares against. */
export function renderFlag(c: CanvasRenderingContext2D, flag: Flag, w: number, h: number, official = true): void {
  c.save();
  c.clearRect(0, 0, w, h);
  flag.draw(c, w, h, (k) => (official ? (flag.colors[k] ?? PALETTE[k]) : PALETTE[k]));
  c.restore();
}
