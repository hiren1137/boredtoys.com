/** A pixel buffer with hard-edged brush strokes, so the paint bucket always fills cleanly. 0 means unpainted. */
export interface Surface {
  readonly w: number;
  readonly h: number;
  readonly data: Uint32Array;
  line(x0: number, y0: number, x1: number, y1: number, r: number, color: number): void;
  fill(x: number, y: number, color: number): boolean;
  snapshot(): void;
  undo(): boolean;
  clear(): void;
  isEmpty(): boolean;
}

const MAX_UNDO = 12;

/** CSS hex to a little-endian RGBA word for a Uint32 view of ImageData. */
export function packHex(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0;
}

export function createSurface(w: number, h: number): Surface {
  const data = new Uint32Array(w * h);
  const history: Uint32Array[] = [];

  function dot(cx: number, cy: number, r: number, color: number): void {
    const r2 = r * r;
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      const span = r2 - dy * dy;
      if (span < 0) continue;
      const dx = Math.sqrt(span);
      const xa = Math.max(0, Math.round(cx - dx));
      const xb = Math.min(w - 1, Math.round(cx + dx) - 1);
      if (xb >= xa) data.fill(color, y * w + xa, y * w + xb + 1);
    }
  }

  return {
    w,
    h,
    data,
    line(x0, y0, x1, y1, r, color) {
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(dist / Math.max(1, r / 3)));
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        dot(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, Math.max(1, r), color);
      }
    },
    fill(sx, sy, color) {
      const x = Math.floor(sx);
      const y = Math.floor(sy);
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      const target = data[y * w + x];
      if (target === color) return false;
      const stack = [x, y];
      while (stack.length) {
        const py = stack.pop()!;
        let px = stack.pop()!;
        let i = py * w + px;
        while (px > 0 && data[i - 1] === target) {
          px--;
          i--;
        }
        let up = false;
        let down = false;
        for (; px < w && data[i] === target; px++, i++) {
          data[i] = color;
          if (py > 0) {
            const t = data[i - w] === target;
            if (t && !up) stack.push(px, py - 1);
            up = t;
          }
          if (py < h - 1) {
            const t = data[i + w] === target;
            if (t && !down) stack.push(px, py + 1);
            down = t;
          }
        }
      }
      return true;
    },
    snapshot() {
      history.push(data.slice());
      if (history.length > MAX_UNDO) history.shift();
    },
    undo() {
      const prev = history.pop();
      if (!prev) return false;
      data.set(prev);
      return true;
    },
    clear() {
      data.fill(0);
    },
    isEmpty() {
      for (let i = 0; i < data.length; i++) if (data[i]) return false;
      return true;
    },
  };
}
