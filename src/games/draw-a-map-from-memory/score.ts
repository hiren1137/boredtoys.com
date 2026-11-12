// Shape comparison for the map drawing game. No imports, so it can be tested on its own.

export interface Pt {
  x: number;
  y: number;
}
export interface Box {
  cx: number;
  cy: number;
  /** The larger of width and height. */
  size: number;
}

/** Turns lon/lat rings into flat x/y rings, squashing longitude by the shape's middle latitude. */
export function project(rings: number[][]): Pt[][] {
  let latSum = 0;
  let n = 0;
  for (const r of rings) for (let i = 1; i < r.length; i += 2) (latSum += r[i]), n++;
  const k = Math.cos(((latSum / n) * Math.PI) / 180);
  return rings.map((r) => {
    const out: Pt[] = [];
    for (let i = 0; i < r.length; i += 2) out.push({ x: r[i] * k, y: -r[i + 1] });
    return out;
  });
}

export function boxOf(lines: Pt[][]): Box {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const l of lines)
    for (const p of l) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, size: Math.max(x1 - x0, y1 - y0) };
}

/** Evenly spaced points along every line, `total` in all, split by length. */
export function resample(lines: Pt[][], closed: boolean, total: number): Pt[] {
  const segs = lines.map((l) => {
    const pts = closed && l.length > 2 ? [...l, l[0]] : l;
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    return { pts, len };
  });
  const sum = segs.reduce((s, g) => s + g.len, 0);
  const out: Pt[] = [];
  for (const { pts, len } of segs) {
    if (pts.length === 1 || len === 0) {
      out.push(pts[0]);
      continue;
    }
    const n = Math.max(2, Math.round((total * len) / (sum || 1)));
    const step = len / n;
    let next = 0;
    let walked = 0;
    for (let i = 1; i < pts.length && out.length < 100000; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= walked + d) {
        const t = d === 0 ? 0 : (next - walked) / d;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        next += step;
      }
      walked += d;
    }
  }
  return out;
}

const normalize = (pts: Pt[], b: Box): Pt[] => pts.map((p) => ({ x: (p.x - b.cx) / b.size, y: (p.y - b.cy) / b.size }));

function meanNearest(from: Pt[], to: Pt[]): number {
  let total = 0;
  for (const a of from) {
    let best = Infinity;
    for (const b of to) {
      const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
      if (d < best) best = d;
    }
    total += Math.sqrt(best);
  }
  return total / from.length;
}

/** Below this the score is 100%; at or above ZERO_AT it is 0%. In units of the shape's size. */
const PERFECT = 0.012;
const ZERO_AT = 0.13;

/**
 * Compares the player's strokes with the real outline after centering both and scaling each so its
 * longer side is 1. Uses the average distance both ways (drawing → outline and outline → drawing),
 * so stray scribbles and missing coastline both cost points.
 */
export function scoreDrawing(strokes: Pt[][], rings: Pt[][]): { score: number; distance: number } {
  const mine = normalize(resample(strokes, false, 320), boxOf(strokes));
  const real = normalize(resample(rings, true, 480), boxOf(rings));
  const distance = (meanNearest(mine, real) + meanNearest(real, mine)) / 2;
  const t = Math.min(1, Math.max(0, (distance - PERFECT) / (ZERO_AT - PERFECT)));
  // Ease so near-misses keep most of their points and wild guesses drop quickly.
  const score = Math.round(100 * (1 - t) ** 1.6);
  return { score, distance };
}

/** The real outline moved and scaled onto the player's drawing, for the reveal overlay. */
export function fitTo(rings: Pt[][], target: Box): Pt[][] {
  const b = boxOf(rings);
  const s = target.size / b.size;
  return rings.map((r) => r.map((p) => ({ x: target.cx + (p.x - b.cx) * s, y: target.cy + (p.y - b.cy) * s })));
}
