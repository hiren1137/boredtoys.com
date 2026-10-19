export const EMPTY = 0;
export const WALL = 1;
export const SAND = 2;
export const WATER = 3;
export const WOOD = 4;
export const FIRE = 5;
export const SMOKE = 6;
export const STEAM = 7;
export const OIL = 8;
export const LAVA = 9;
export const ICE = 10;
export const PLANT = 11;
export const ACID = 12;
export const SALT = 13;
export const SALTWATER = 14;
export const GUNPOWDER = 15;
export const STONE = 16;
export const GLASS = 17;
export const ERASER = 255;
export const COUNT = 18;

export const STATIC = 0;
export const POWDER = 1;
export const LIQUID = 2;
export const GAS = 3;

interface Def {
  kind: number;
  dens: number;
  rgb: [number, number, number];
  vary: number;
}

const DEFS: Def[] = [];
DEFS[EMPTY] = { kind: GAS, dens: 0, rgb: [21, 19, 33], vary: 0 };
DEFS[WALL] = { kind: STATIC, dens: 255, rgb: [112, 108, 128], vary: 8 };
DEFS[SAND] = { kind: POWDER, dens: 6, rgb: [232, 198, 112], vary: 22 };
DEFS[WATER] = { kind: LIQUID, dens: 3, rgb: [52, 128, 238], vary: 10 };
DEFS[WOOD] = { kind: STATIC, dens: 255, rgb: [140, 92, 48], vary: 14 };
DEFS[FIRE] = { kind: GAS, dens: 0, rgb: [255, 140, 30], vary: 0 };
DEFS[SMOKE] = { kind: GAS, dens: 0, rgb: [104, 100, 116], vary: 8 };
DEFS[STEAM] = { kind: GAS, dens: 0, rgb: [200, 214, 234], vary: 8 };
DEFS[OIL] = { kind: LIQUID, dens: 2, rgb: [150, 112, 44], vary: 8 };
DEFS[LAVA] = { kind: LIQUID, dens: 5, rgb: [255, 84, 24], vary: 0 };
DEFS[ICE] = { kind: STATIC, dens: 255, rgb: [184, 230, 255], vary: 10 };
DEFS[PLANT] = { kind: STATIC, dens: 255, rgb: [60, 190, 86], vary: 24 };
DEFS[ACID] = { kind: LIQUID, dens: 3, rgb: [150, 250, 60], vary: 16 };
DEFS[SALT] = { kind: POWDER, dens: 6, rgb: [240, 240, 244], vary: 10 };
DEFS[SALTWATER] = { kind: LIQUID, dens: 4, rgb: [96, 168, 250], vary: 10 };
DEFS[GUNPOWDER] = { kind: POWDER, dens: 6, rgb: [92, 86, 100], vary: 26 };
DEFS[STONE] = { kind: POWDER, dens: 7, rgb: [146, 140, 156], vary: 22 };
DEFS[GLASS] = { kind: STATIC, dens: 255, rgb: [196, 238, 246], vary: 6 };

export const KIND = Uint8Array.from(DEFS.map((d) => d.kind));
export const DENS = Uint8Array.from(DEFS.map((d) => d.dens));

/** Elements shown in the picker, in order. Salt water and glass can only be made, not placed. */
export const PALETTE: { id: number; label: string; key: string }[] = [
  { id: SAND, label: 'Sand', key: '1' },
  { id: WATER, label: 'Water', key: '2' },
  { id: WALL, label: 'Wall', key: '3' },
  { id: WOOD, label: 'Wood', key: '4' },
  { id: FIRE, label: 'Fire', key: '5' },
  { id: OIL, label: 'Oil', key: '6' },
  { id: LAVA, label: 'Lava', key: '7' },
  { id: ICE, label: 'Ice', key: '8' },
  { id: PLANT, label: 'Plant', key: '9' },
  { id: ACID, label: 'Acid', key: '0' },
  { id: SALT, label: 'Salt', key: '' },
  { id: GUNPOWDER, label: 'Gunpowder', key: '' },
  { id: STONE, label: 'Stone', key: '' },
  { id: STEAM, label: 'Steam', key: '' },
  { id: SMOKE, label: 'Smoke', key: '' },
  { id: ERASER, label: 'Eraser', key: 'e' },
];

export const swatch = (id: number) => {
  if (id === ERASER) return 'transparent';
  const [r, g, b] = DEFS[id].rgb;
  return `rgb(${r} ${g} ${b})`;
};

const pack = (r: number, g: number, b: number) =>
  (255 << 24) | (Math.max(0, Math.min(255, b)) << 16) | (Math.max(0, Math.min(255, g)) << 8) | Math.max(0, Math.min(255, r));

const mix = (a: [number, number, number], b: [number, number, number], k: number) =>
  pack(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);

/**
 * 16 shades per element, packed as little-endian RGBA for a Uint32 view of ImageData.
 * Gases use the shade slot for how much life is left, so they fade out smoothly.
 */
export function buildColors(): Uint32Array {
  const table = new Uint32Array(COUNT * 16);
  const bg = DEFS[EMPTY].rgb;
  const flame: [number, number, number][] = [
    [190, 40, 20],
    [255, 90, 20],
    [255, 150, 30],
    [255, 214, 70],
  ];
  for (let t = 0; t < COUNT; t++) {
    const d = DEFS[t];
    for (let s = 0; s < 16; s++) {
      const k = s / 15;
      let c: number;
      if (t === FIRE) {
        const f = k * 3;
        const i = Math.min(2, Math.floor(f));
        c = mix(flame[i], flame[i + 1], f - i);
      } else if (t === LAVA) {
        c = mix([220, 50, 16], [255, 150, 40], k);
      } else if (t === SMOKE || t === STEAM) {
        c = mix(bg, d.rgb, 0.25 + k * 0.75);
      } else {
        const v = (k - 0.5) * 2 * d.vary;
        c = pack(d.rgb[0] + v, d.rgb[1] + v, d.rgb[2] + v);
      }
      table[t * 16 + s] = c;
    }
  }
  return table;
}

/** Colour of wood that is on fire, picked per frame for a flicker. */
export const BURNING = [pack(255, 120, 40), pack(230, 80, 30), pack(255, 170, 60), pack(170, 70, 30)];

export interface Reaction {
  id: string;
  name: string;
  hint: string;
}

export const REACTIONS: Reaction[] = [
  { id: 'lava-water', name: 'Lava + water makes stone', hint: 'Cool something red-hot with something wet.' },
  { id: 'wood-burn', name: 'Wood catches fire', hint: 'Bring a flame to the brown stuff.' },
  { id: 'oil-burn', name: 'Oil goes up in flames', hint: 'A slippery liquid that really loves fire.' },
  { id: 'plant-burn', name: 'Plants burn', hint: 'Green things are not fireproof.' },
  { id: 'boom', name: 'Gunpowder explodes', hint: 'Grey powder plus heat. Stand back.' },
  { id: 'ice-melt', name: 'Heat melts ice', hint: 'Warm up something frozen.' },
  { id: 'fire-out', name: 'Water puts out fire', hint: 'The oldest way to stop flames.' },
  { id: 'rain', name: 'Steam turns back into water', hint: 'Let some hot vapor cool off.' },
  { id: 'plant-grow', name: 'Plants drink and grow', hint: 'Give a little green sprout a drink.' },
  { id: 'acid', name: 'Acid eats through things', hint: 'Pour the bright green goo on almost anything.' },
  { id: 'salt-dissolve', name: 'Salt dissolves in water', hint: 'Sprinkle something white into something blue.' },
  { id: 'salt-ice', name: 'Salt melts ice', hint: 'Do what road crews do in winter.' },
  { id: 'salt-crystals', name: 'Boiled salt water leaves salt', hint: 'Heat up some salty water.' },
  { id: 'glass', name: 'Sand melts into glass', hint: 'Sand needs to get really, really hot.' },
  { id: 'lava-ignite', name: 'Lava sets things alight', hint: 'Let molten rock touch something that burns.' },
];
