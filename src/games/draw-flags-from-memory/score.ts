import { KEYS, PALETTE, renderFlag, type Flag } from './flags';
import type { Surface } from './paint';

const GRID = 60;
const SUB = 2;
const MAX_DIST = 240;

type RGB = [number, number, number];
const hexRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const POTS = KEYS.map((k) => hexRgb(PALETTE[k]));

/** "Redmean" colour distance: cheap and much closer to how eyes judge colour than plain RGB. */
function distance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

function nearestPot(r: number, g: number, b: number): RGB {
  let best = POTS[0];
  let bd = Infinity;
  for (const p of POTS) {
    const d = distance(r, g, b, p[0], p[1], p[2]);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}

/**
 * Compares the drawing with the real flag on a 60-wide grid (4 samples per cell).
 * Each sample earns credit for how close its colour is; unpainted samples earn nothing.
 */
export function scoreDrawing(surface: Surface, flag: Flag): number {
  const { w, h, data } = surface;
  const ref = document.createElement('canvas');
  ref.width = w;
  ref.height = h;
  const rc = ref.getContext('2d', { willReadFrequently: true });
  if (!rc) return 0;
  renderFlag(rc, flag, w, h, false);
  const rd = rc.getImageData(0, 0, w, h).data;
  const gw = GRID;
  const gh = Math.max(1, Math.round(GRID * flag.ratio));
  let total = 0;
  let n = 0;
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      for (let s = 0; s < SUB * SUB; s++) {
        const x = Math.min(w - 1, Math.floor(((gx + ((s % SUB) + 0.5) / SUB) / gw) * w));
        const y = Math.min(h - 1, Math.floor(((gy + (Math.floor(s / SUB) + 0.5) / SUB) / gh) * h));
        const i = y * w + x;
        n++;
        const u = data[i];
        if (!(u >>> 24)) continue;
        const want = nearestPot(rd[i * 4], rd[i * 4 + 1], rd[i * 4 + 2]);
        const d = distance(u & 255, (u >> 8) & 255, (u >> 16) & 255, want[0], want[1], want[2]);
        total += Math.max(0, 1 - d / MAX_DIST);
      }
    }
  }
  return Math.round((total / n) * 100);
}
