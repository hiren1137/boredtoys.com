import {
  ACID,
  BURNING,
  DENS,
  EMPTY,
  ERASER,
  FIRE,
  GAS,
  GLASS,
  GUNPOWDER,
  ICE,
  KIND,
  LAVA,
  LIQUID,
  OIL,
  PLANT,
  REACTIONS,
  SALT,
  SALTWATER,
  SAND,
  SMOKE,
  STATIC,
  STEAM,
  STONE,
  WALL,
  WATER,
  WOOD,
  buildColors,
} from './elements';

const R = (id: string) => REACTIONS.findIndex((r) => r.id === id);
const R_LAVA_WATER = R('lava-water');
const R_WOOD = R('wood-burn');
const R_OIL = R('oil-burn');
const R_PLANT_BURN = R('plant-burn');
const R_BOOM = R('boom');
const R_MELT = R('ice-melt');
const R_FIRE_OUT = R('fire-out');
const R_RAIN = R('rain');
const R_GROW = R('plant-grow');
const R_ACID = R('acid');
const R_SALT = R('salt-dissolve');
const R_SALT_ICE = R('salt-ice');
const R_CRYSTALS = R('salt-crystals');
const R_GLASS = R('glass');
const R_LAVA_IGNITE = R('lava-ignite');

const ACID_EATS = new Uint8Array(32);
for (const t of [SAND, WOOD, PLANT, SALT, GUNPOWDER, ICE, STONE]) ACID_EATS[t] = 1;

const rand = Math.random;
const fireLife = () => 20 + ((rand() * 40) | 0);
const smokeLife = () => 40 + ((rand() * 60) | 0);
const steamLife = () => 140 + ((rand() * 100) | 0);

function startLife(t: number): number {
  if (t === FIRE) return fireLife();
  if (t === SMOKE) return smokeLife();
  if (t === STEAM) return steamLife();
  return 0;
}

export interface Sim {
  readonly w: number;
  readonly h: number;
  step(): void;
  paint(cx: number, cy: number, r: number, el: number): number;
  clear(): void;
  resize(w: number, h: number): void;
  render(buf: Uint32Array, frame: number): void;
}

/** A cellular-automaton sandbox on flat typed arrays. `onReaction` fires the first time each reaction happens. */
export function createSim(w0: number, h0: number, onReaction: (index: number) => void): Sim {
  let W = w0;
  let H = h0;
  let type = new Uint8Array(W * H);
  let life = new Uint8Array(W * H);
  let shade = new Uint8Array(W * H);
  let stamp = new Uint8Array(W * H);
  let mark = 1;
  const seen = new Uint8Array(REACTIONS.length);
  const colors = buildColors();
  const bg = colors[EMPTY * 16];

  function hit(r: number): void {
    if (seen[r]) return;
    seen[r] = 1;
    onReaction(r);
  }

  function set(i: number, t: number, l = 0): void {
    type[i] = t;
    life[i] = l;
    shade[i] = (rand() * 256) | 0;
    stamp[i] = mark;
  }

  function swap(a: number, b: number): void {
    const t = type[a];
    const l = life[a];
    const s = shade[a];
    type[a] = type[b];
    life[a] = life[b];
    shade[a] = shade[b];
    type[b] = t;
    life[b] = l;
    shade[b] = s;
    stamp[a] = mark;
    stamp[b] = mark;
  }

  /** One of the four direct neighbours at random, or -1 at the edge. */
  function randomNeighbour(i: number, x: number, y: number): number {
    const r = (rand() * 4) | 0;
    if (r === 0) return y > 0 ? i - W : -1;
    if (r === 1) return y < H - 1 ? i + W : -1;
    if (r === 2) return x > 0 ? i - 1 : -1;
    return x < W - 1 ? i + 1 : -1;
  }

  const nb = new Int32Array(4);
  function around(i: number, x: number, y: number): Int32Array {
    nb[0] = y > 0 ? i - W : -1;
    nb[1] = y < H - 1 ? i + W : -1;
    nb[2] = x > 0 ? i - 1 : -1;
    nb[3] = x < W - 1 ? i + 1 : -1;
    return nb;
  }

  function sinks(t: number, j: number): boolean {
    const u = type[j];
    if (u === EMPTY) return true;
    const k = KIND[u];
    if (k === GAS) return true;
    if (k === LIQUID) return DENS[u] < DENS[t] && rand() < 0.5;
    return false;
  }

  function fall(i: number, x: number, y: number, t: number): boolean {
    if (y >= H - 1) return false;
    const b = i + W;
    if (sinks(t, b)) {
      swap(i, b);
      return true;
    }
    const d = rand() < 0.5 ? -1 : 1;
    let nx = x + d;
    if (nx >= 0 && nx < W && sinks(t, b + d)) {
      swap(i, b + d);
      return true;
    }
    nx = x - d;
    if (nx >= 0 && nx < W && sinks(t, b - d)) {
      swap(i, b - d);
      return true;
    }
    return false;
  }

  function slide(i: number, x: number, d: number, spread: number): boolean {
    let best = -1;
    for (let k = 1; k <= spread; k++) {
      const nx = x + d * k;
      if (nx < 0 || nx >= W) break;
      const u = type[i + d * k];
      if (u === EMPTY || KIND[u] === GAS) best = i + d * k;
      else break;
    }
    if (best < 0) return false;
    swap(i, best);
    return true;
  }

  function flow(i: number, x: number, y: number, t: number, spread: number): void {
    if (fall(i, x, y, t)) return;
    const d = rand() < 0.5 ? -1 : 1;
    if (!slide(i, x, d, spread)) slide(i, x, -d, spread);
  }

  function gasInto(t: number, j: number): boolean {
    const u = type[j];
    if (u === EMPTY) return true;
    return t !== FIRE && KIND[u] === LIQUID && rand() < 0.08;
  }

  function rise(i: number, x: number, y: number, t: number, up: number): void {
    const d = rand() < 0.5 ? -1 : 1;
    if (rand() < up && y > 0) {
      const a = i - W;
      if (gasInto(t, a)) return swap(i, a);
      if (x + d >= 0 && x + d < W && gasInto(t, a + d)) return swap(i, a + d);
    }
    if (x + d >= 0 && x + d < W && type[i + d] === EMPTY) swap(i, i + d);
  }

  function explode(c: number): void {
    const cx = c % W;
    const cy = (c / W) | 0;
    const rr = 5;
    for (let dy = -rr; dy <= rr; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= H) continue;
      for (let dx = -rr; dx <= rr; dx++) {
        const x = cx + dx;
        const d2 = dx * dx + dy * dy;
        if (x < 0 || x >= W || d2 > rr * rr) continue;
        const j = y * W + x;
        const u = type[j];
        if (u === WALL || u === GLASS) continue;
        if (u === GUNPOWDER) set(j, FIRE, 4 + ((rand() * 6) | 0));
        else if (u === WATER || u === SALTWATER) {
          if (rand() < 0.5) set(j, STEAM, steamLife());
        } else if (d2 <= 10) set(j, rand() < 0.7 ? FIRE : SMOKE, 6 + ((rand() * 20) | 0));
        else if (u === EMPTY && rand() < 0.5) set(j, FIRE, 4 + ((rand() * 14) | 0));
        else ignite(j, 3, false);
      }
    }
  }

  /** Heat touching cell n. `p` scales the odds; lava counts as its own reaction too. */
  function ignite(n: number, p: number, lava: boolean): void {
    const u = type[n];
    if (u === WOOD) {
      if (life[n] === 0 && rand() < 0.05 * p) {
        life[n] = 100 + ((rand() * 120) | 0);
        stamp[n] = mark;
        hit(R_WOOD);
        if (lava) hit(R_LAVA_IGNITE);
      }
    } else if (u === OIL) {
      if (rand() < 0.3 * p) {
        set(n, FIRE, 30 + ((rand() * 40) | 0));
        hit(R_OIL);
        if (lava) hit(R_LAVA_IGNITE);
      }
    } else if (u === PLANT) {
      if (rand() < 0.08 * p) {
        set(n, FIRE, fireLife());
        hit(R_PLANT_BURN);
        if (lava) hit(R_LAVA_IGNITE);
      }
    } else if (u === GUNPOWDER) {
      explode(n);
      hit(R_BOOM);
      if (lava) hit(R_LAVA_IGNITE);
    } else if (u === ICE) {
      if (rand() < 0.05 * p) {
        set(n, WATER);
        hit(R_MELT);
      }
    }
  }

  function fire(i: number, x: number, y: number): void {
    const n = around(i, x, y);
    for (let k = 0; k < 4; k++) {
      const j = n[k];
      if (j < 0) continue;
      const u = type[j];
      if (u === WATER) {
        if (rand() < 0.5) {
          set(i, STEAM, steamLife());
          if (rand() < 0.15) set(j, STEAM, steamLife());
          hit(R_FIRE_OUT);
          return;
        }
      } else if (u === SALTWATER) {
        if (rand() < 0.15) {
          set(j, SALT);
          set(i, STEAM, steamLife());
          hit(R_CRYSTALS);
          return;
        }
      } else ignite(j, 1, false);
    }
    if (type[i] !== FIRE) return;
    const l = life[i] - 1;
    if (l <= 0) {
      if (rand() < 0.35) set(i, SMOKE, smokeLife());
      else set(i, EMPTY);
      return;
    }
    life[i] = l;
    rise(i, x, y, FIRE, 0.45);
  }

  function burningWood(i: number, x: number, y: number): void {
    const j = randomNeighbour(i, x, y);
    if (j >= 0) {
      const u = type[j];
      if (u === WATER || u === SALTWATER) {
        life[i] = 0;
        set(j, STEAM, steamLife());
        hit(R_FIRE_OUT);
        return;
      }
      ignite(j, 2, false);
    }
    if (y > 0 && type[i - W] === EMPTY && rand() < 0.3) set(i - W, FIRE, 8 + ((rand() * 16) | 0));
    const l = life[i] - 1;
    if (l <= 0) set(i, rand() < 0.5 ? FIRE : SMOKE, 20 + ((rand() * 30) | 0));
    else life[i] = l;
  }

  function lava(i: number, x: number, y: number): void {
    const n = around(i, x, y);
    for (let k = 0; k < 4; k++) {
      const j = n[k];
      if (j < 0) continue;
      const u = type[j];
      if (u === WATER || u === SALTWATER) {
        set(i, STONE);
        set(j, STEAM, steamLife());
        hit(R_LAVA_WATER);
        return;
      }
      if (u === SAND) {
        if (rand() < 0.004) {
          set(j, GLASS);
          hit(R_GLASS);
        }
      } else ignite(j, 1, true);
    }
    if (y > 0 && type[i - W] === EMPTY && rand() < 0.002) set(i - W, FIRE, 6 + ((rand() * 10) | 0));
    if (rand() < 0.3) flow(i, x, y, LAVA, 1);
  }

  function acid(i: number, x: number, y: number): void {
    const j = randomNeighbour(i, x, y);
    if (j >= 0 && ACID_EATS[type[j]] && rand() < 0.3) {
      if (rand() < 0.25) set(j, SMOKE, smokeLife());
      else set(j, EMPTY);
      hit(R_ACID);
      if (rand() < 0.2) {
        set(i, EMPTY);
        return;
      }
    }
    flow(i, x, y, ACID, 3);
  }

  function salt(i: number, x: number, y: number): void {
    const j = randomNeighbour(i, x, y);
    if (j >= 0) {
      const u = type[j];
      if (u === WATER && rand() < 0.04) {
        set(i, EMPTY);
        set(j, SALTWATER);
        hit(R_SALT);
        return;
      }
      if (u === ICE && rand() < 0.03) {
        set(j, WATER);
        hit(R_SALT_ICE);
      }
    }
    fall(i, x, y, SALT);
  }

  function step(): void {
    mark = mark === 255 ? 1 : mark + 1;
    for (let y = H - 1; y >= 0; y--) {
      const ltr = rand() < 0.5;
      const row = y * W;
      for (let k = 0; k < W; k++) {
        const x = ltr ? k : W - 1 - k;
        const i = row + x;
        const t = type[i];
        if (t === EMPTY || stamp[i] === mark) continue;
        switch (t) {
          case SAND:
          case STONE:
          case GUNPOWDER:
            fall(i, x, y, t);
            break;
          case WATER:
            flow(i, x, y, t, 5);
            break;
          case SALTWATER:
            flow(i, x, y, t, 4);
            break;
          case OIL:
            flow(i, x, y, t, 3);
            break;
          case LAVA:
            lava(i, x, y);
            break;
          case ACID:
            acid(i, x, y);
            break;
          case SALT:
            salt(i, x, y);
            break;
          case FIRE:
            fire(i, x, y);
            break;
          case WOOD:
            if (life[i]) burningWood(i, x, y);
            break;
          case PLANT:
            if (rand() < 0.12) {
              const j = randomNeighbour(i, x, y);
              if (j >= 0 && type[j] === WATER && rand() < 0.35) {
                set(j, PLANT);
                hit(R_GROW);
              }
            }
            break;
          case SMOKE: {
            const l = life[i] - 1;
            if (l <= 0) set(i, EMPTY);
            else {
              life[i] = l;
              rise(i, x, y, SMOKE, 0.7);
            }
            break;
          }
          case STEAM: {
            const l = life[i] - 1;
            if (l <= 0) {
              if (rand() < 0.6) {
                set(i, WATER);
                hit(R_RAIN);
              } else set(i, EMPTY);
            } else {
              life[i] = l;
              rise(i, x, y, STEAM, 0.6);
            }
            break;
          }
        }
      }
    }
  }

  function paint(cx: number, cy: number, r: number, el: number): number {
    let placed = 0;
    const kind = el === ERASER ? STATIC : KIND[el];
    const odds = kind === STATIC ? 1 : el === FIRE ? 0.5 : 0.3;
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= H) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= W || dx * dx + dy * dy > r * r + r) continue;
        const j = y * W + x;
        if (el === ERASER) {
          if (type[j] !== EMPTY) {
            type[j] = EMPTY;
            life[j] = 0;
            placed++;
          }
        } else if (type[j] === EMPTY && rand() < odds) {
          set(j, el, startLife(el));
          placed++;
        }
      }
    }
    return placed;
  }

  function clear(): void {
    type.fill(0);
    life.fill(0);
  }

  /** Keeps whatever was on screen, anchored to the floor, when the box changes size. */
  function resize(w: number, h: number): void {
    if (w === W && h === H) return;
    const nt = new Uint8Array(w * h);
    const nl = new Uint8Array(w * h);
    const ns = new Uint8Array(w * h);
    const cw = Math.min(w, W);
    for (let y = 0; y < Math.min(h, H); y++) {
      const src = (H - 1 - y) * W;
      const dst = (h - 1 - y) * w;
      nt.set(type.subarray(src, src + cw), dst);
      nl.set(life.subarray(src, src + cw), dst);
      ns.set(shade.subarray(src, src + cw), dst);
    }
    W = w;
    H = h;
    type = nt;
    life = nl;
    shade = ns;
    stamp = new Uint8Array(w * h);
  }

  function render(buf: Uint32Array, frame: number): void {
    const n = W * H;
    for (let i = 0; i < n; i++) {
      const t = type[i];
      if (t === EMPTY) {
        buf[i] = bg;
        continue;
      }
      let s = shade[i] >> 4;
      if (t === FIRE) s = Math.min(15, (life[i] >> 2) + (shade[i] & 3) + ((frame + i) & 1));
      else if (t === SMOKE) s = Math.min(15, life[i] >> 2);
      else if (t === STEAM) s = Math.min(15, life[i] >> 3);
      else if (t === LAVA) s = (s + (frame >> 3)) & 15;
      else if (t === WOOD && life[i]) {
        buf[i] = BURNING[(shade[i] + (frame >> 1)) & 3];
        continue;
      }
      buf[i] = colors[t * 16 + s];
    }
  }

  return {
    get w() {
      return W;
    },
    get h() {
      return H;
    },
    step,
    paint,
    clear,
    resize,
    render,
  };
}
