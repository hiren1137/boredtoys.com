export const LIGHT_YEAR = 9.4607e15;
const INK = '#1f1a2e';

type Draw = (c: CanvasRenderingContext2D, x: number, base: number, w: number, h: number) => void;

export interface Landmark {
  /** Height or distance in meters. */
  size: number;
  name: string;
  /** Short form for share text, e.g. "the Moon". */
  short: string;
  sizeLabel: string;
  /** "tall" things stand on the ground at true scale; "far" things are markers at a distance. */
  kind: 'tall' | 'far';
  /** width / height for tall things */
  aspect?: number;
  draw: Draw;
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (typeof c.roundRect === 'function') c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
}

function shape(c: CanvasRenderingContext2D, fill: string, path: () => void, lw = 2.5): void {
  c.beginPath();
  path();
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.lineJoin = 'round';
  c.stroke();
}

const slab =
  (fill: string, stripe?: string): Draw =>
  (c, x, base, w, h) => {
    shape(c, fill, () => c.rect(x - w / 2, base - h, w, h));
    if (stripe && h > 6) {
      c.fillStyle = stripe;
      c.fillRect(x - w / 2 + 6, base - h * 0.7, w - 12, Math.max(1.5, h * 0.25));
    }
  };

const can: Draw = (c, x, base, w, h) => {
  shape(c, '#ff7466', () => {
    rr(c, x - w / 2, base - h, w, h, Math.min(w, h) * 0.12);
  });
  c.fillStyle = '#fffdf7';
  c.fillRect(x - w / 2 + 2, base - h * 0.62, w - 4, h * 0.2);
};

const person: Draw = (c, x, base, w, h) => {
  const head = h * 0.13;
  shape(c, '#ffd447', () => c.arc(x, base - h + head, head, 0, Math.PI * 2));
  shape(c, '#6cc8ff', () => rr(c, x - w * 0.32, base - h + head * 2.1, w * 0.64, h * 0.42, w * 0.2));
  c.lineWidth = Math.max(2, w * 0.16);
  c.lineCap = 'round';
  c.strokeStyle = INK;
  c.beginPath();
  c.moveTo(x - w * 0.14, base - h * 0.32);
  c.lineTo(x - w * 0.16, base);
  c.moveTo(x + w * 0.14, base - h * 0.32);
  c.lineTo(x + w * 0.16, base);
  c.stroke();
};

const giraffe: Draw = (c, x, base, w, h) => {
  const bodyY = base - h * 0.42;
  shape(c, '#ffd447', () => {
    c.moveTo(x - w * 0.45, bodyY);
    c.lineTo(x + w * 0.2, bodyY);
    c.lineTo(x + w * 0.22, base - h * 0.95);
    c.lineTo(x + w * 0.45, base - h * 0.92);
    c.lineTo(x + w * 0.4, base - h * 0.85);
    c.lineTo(x + w * 0.32, base - h * 0.84);
    c.lineTo(x + w * 0.35, bodyY + h * 0.12);
    c.lineTo(x - w * 0.45, bodyY + h * 0.12);
    c.closePath();
  });
  c.lineWidth = Math.max(2, w * 0.07);
  c.strokeStyle = INK;
  c.beginPath();
  for (const lx of [-0.4, -0.25, 0.15, 0.3]) {
    c.moveTo(x + w * lx, bodyY + h * 0.12);
    c.lineTo(x + w * lx, base);
  }
  c.stroke();
  c.fillStyle = '#ffac57';
  for (const [sx, sy] of [[-0.25, 0.05], [0, 0.07], [0.26, -0.15], [0.27, -0.32]]) {
    c.beginPath();
    c.arc(x + w * sx, bodyY + h * sy, Math.max(1.5, w * 0.05), 0, Math.PI * 2);
    c.fill();
  }
};

const house: Draw = (c, x, base, w, h) => {
  shape(c, '#ffa3d1', () => c.rect(x - w / 2, base - h * 0.6, w, h * 0.6));
  shape(c, '#ff7466', () => {
    c.moveTo(x - w * 0.6, base - h * 0.58);
    c.lineTo(x, base - h);
    c.lineTo(x + w * 0.6, base - h * 0.58);
    c.closePath();
  });
  shape(c, '#6cc8ff', () => c.rect(x - w * 0.32, base - h * 0.45, w * 0.22, h * 0.16), 2);
  shape(c, '#6cc8ff', () => c.rect(x + w * 0.1, base - h * 0.45, w * 0.22, h * 0.16), 2);
  shape(c, '#ffd447', () => c.rect(x - w * 0.1, base - h * 0.24, w * 0.2, h * 0.24), 2);
};

const statue: Draw = (c, x, base, w, h) => {
  shape(c, '#dcd8e4', () => c.rect(x - w * 0.45, base - h * 0.46, w * 0.9, h * 0.46));
  shape(c, '#6be3a8', () => {
    c.moveTo(x - w * 0.22, base - h * 0.46);
    c.lineTo(x - w * 0.12, base - h * 0.82);
    c.lineTo(x + w * 0.12, base - h * 0.82);
    c.lineTo(x + w * 0.22, base - h * 0.46);
    c.closePath();
  });
  shape(c, '#6be3a8', () => c.arc(x, base - h * 0.86, w * 0.1, 0, Math.PI * 2));
  shape(c, '#6be3a8', () => c.rect(x + w * 0.1, base - h * 0.97, w * 0.08, h * 0.16));
  shape(c, '#ffd447', () => c.arc(x + w * 0.14, base - h * 0.98, w * 0.07, 0, Math.PI * 2));
};

const eiffel: Draw = (c, x, base, w, h) => {
  shape(c, '#b07a4f', () => {
    c.moveTo(x - w / 2, base);
    c.quadraticCurveTo(x - w * 0.12, base - h * 0.45, x - w * 0.03, base - h);
    c.lineTo(x + w * 0.03, base - h);
    c.quadraticCurveTo(x + w * 0.12, base - h * 0.45, x + w / 2, base);
    c.lineTo(x + w * 0.25, base);
    c.quadraticCurveTo(x, base - h * 0.2, x - w * 0.25, base);
    c.closePath();
  });
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - w * 0.3, base - h * 0.3);
  c.lineTo(x + w * 0.3, base - h * 0.3);
  c.moveTo(x - w * 0.14, base - h * 0.6);
  c.lineTo(x + w * 0.14, base - h * 0.6);
  c.stroke();
};

const tower: Draw = (c, x, base, w, h) => {
  shape(c, '#6cc8ff', () => {
    c.moveTo(x - w / 2, base);
    c.lineTo(x - w * 0.3, base - h * 0.35);
    c.lineTo(x - w * 0.15, base - h * 0.65);
    c.lineTo(x - w * 0.03, base - h);
    c.lineTo(x + w * 0.03, base - h);
    c.lineTo(x + w * 0.15, base - h * 0.6);
    c.lineTo(x + w * 0.3, base - h * 0.3);
    c.lineTo(x + w / 2, base);
    c.closePath();
  });
};

const mountain: Draw = (c, x, base, w, h) => {
  shape(c, '#9aa0c4', () => {
    c.moveTo(x - w / 2, base);
    c.lineTo(x - w * 0.12, base - h * 0.7);
    c.lineTo(x, base - h);
    c.lineTo(x + w * 0.22, base - h * 0.6);
    c.lineTo(x + w / 2, base);
    c.closePath();
  });
  shape(c, '#ffffff', () => {
    c.moveTo(x - w * 0.12, base - h * 0.7);
    c.lineTo(x, base - h);
    c.lineTo(x + w * 0.13, base - h * 0.76);
    c.lineTo(x + w * 0.04, base - h * 0.7);
    c.lineTo(x - w * 0.04, base - h * 0.76);
    c.closePath();
  }, 2);
};

const earthBall: Draw = (c, x, base, w, h) => {
  const r = h / 2;
  shape(c, '#6cc8ff', () => c.arc(x, base - r, r, 0, Math.PI * 2));
  c.save();
  c.beginPath();
  c.arc(x, base - r, r, 0, Math.PI * 2);
  c.clip();
  c.fillStyle = '#6be3a8';
  c.beginPath();
  c.ellipse(x - r * 0.3, base - r * 1.3, r * 0.35, r * 0.25, 0.4, 0, Math.PI * 2);
  c.ellipse(x + r * 0.35, base - r * 0.7, r * 0.3, r * 0.4, -0.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

// ---------- markers for far-away things (icon size is fixed, not to scale) ----------
const icon =
  (fn: (c: CanvasRenderingContext2D, x: number, y: number, r: number) => void): Draw =>
  (c, x, base, _w, h) =>
    fn(c, x, base - h, 16);

const plane = icon((c, x, y, r) => {
  shape(c, '#ffffff', () => {
    c.ellipse(x, y, r * 1.2, r * 0.32, 0, 0, Math.PI * 2);
  });
  shape(c, '#ff7466', () => {
    c.moveTo(x - r * 0.2, y);
    c.lineTo(x - r * 0.6, y + r * 0.9);
    c.lineTo(x + r * 0.1, y);
    c.closePath();
  }, 2);
});
const lineMark = icon((c, x, y, r) => shape(c, '#c7a3ff', () => c.arc(x, y, r * 0.5, 0, Math.PI * 2)));
const station = icon((c, x, y, r) => {
  shape(c, '#6cc8ff', () => c.rect(x - r * 1.3, y - r * 0.35, r * 0.9, r * 0.7), 2);
  shape(c, '#6cc8ff', () => c.rect(x + r * 0.4, y - r * 0.35, r * 0.9, r * 0.7), 2);
  shape(c, '#dcd8e4', () => c.rect(x - r * 0.4, y - r * 0.3, r * 0.8, r * 0.6), 2);
});
const satellite = icon((c, x, y, r) => {
  shape(c, '#ffd447', () => c.rect(x - r * 0.35, y - r * 0.35, r * 0.7, r * 0.7), 2);
  shape(c, '#6cc8ff', () => c.rect(x - r * 1.3, y - r * 0.2, r * 0.8, r * 0.4), 2);
  shape(c, '#6cc8ff', () => c.rect(x + r * 0.5, y - r * 0.2, r * 0.8, r * 0.4), 2);
});
const moon = icon((c, x, y, r) => {
  shape(c, '#dcd8e4', () => c.arc(x, y, r, 0, Math.PI * 2));
  c.fillStyle = '#b9b3c6';
  c.beginPath();
  c.arc(x - r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2);
  c.arc(x + r * 0.35, y + r * 0.3, r * 0.15, 0, Math.PI * 2);
  c.fill();
});
const sun = icon((c, x, y, r) => {
  c.strokeStyle = '#ffac57';
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    c.moveTo(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2);
    c.lineTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6);
  }
  c.stroke();
  shape(c, '#ffd447', () => c.arc(x, y, r, 0, Math.PI * 2));
});
const planet = icon((c, x, y, r) => shape(c, '#6c9cff', () => c.arc(x, y, r * 0.8, 0, Math.PI * 2)));
const beam = icon((c, x, y, r) => {
  shape(c, '#fff3b0', () => {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }, 2);
});
const redStar = icon((c, x, y, r) => {
  shape(c, '#ff7466', () => c.arc(x, y, r * 0.75, 0, Math.PI * 2));
  c.fillStyle = '#ffd447';
  c.beginPath();
  c.arc(x - r * 0.2, y - r * 0.2, r * 0.25, 0, Math.PI * 2);
  c.fill();
});
const galaxy = (color: string) =>
  icon((c, x, y, r) => {
    shape(c, color, () => c.ellipse(x, y, r * 1.4, r * 0.55, -0.3, 0, Math.PI * 2));
    shape(c, '#fff3b0', () => c.arc(x, y, r * 0.3, 0, Math.PI * 2), 2);
  });
const bubble = icon((c, x, y, r) => {
  shape(c, '#c7a3ff', () => c.arc(x, y, r, 0, Math.PI * 2));
  c.fillStyle = '#fffdf7';
  for (const [dx, dy] of [[-0.4, -0.2], [0.3, 0.3], [0.1, -0.5], [-0.2, 0.45]]) {
    c.beginPath();
    c.arc(x + dx * r, y + dy * r, 1.6, 0, Math.PI * 2);
    c.fill();
  }
});

export const LANDMARKS: Landmark[] = [
  { size: 0.00076, name: 'A credit card', short: 'a credit card', sizeLabel: '0.76 mm thick', kind: 'tall', aspect: 40, draw: slab('#ffd447', '#1f1a2e') },
  { size: 0.008, name: 'A smartphone', short: 'a smartphone', sizeLabel: 'about 8 mm thick', kind: 'tall', aspect: 9, draw: slab('#3a3150', '#6cc8ff') },
  { size: 0.12, name: 'A soda can', short: 'a soda can', sizeLabel: 'about 12 cm tall', kind: 'tall', aspect: 0.55, draw: can },
  { size: 1.7, name: 'A grown-up', short: 'a grown-up', sizeLabel: 'about 1.7 m tall', kind: 'tall', aspect: 0.32, draw: person },
  { size: 5.5, name: 'A tall giraffe', short: 'a giraffe', sizeLabel: 'about 5.5 m tall', kind: 'tall', aspect: 0.6, draw: giraffe },
  { size: 9, name: 'A two-story house', short: 'a house', sizeLabel: 'about 9 m tall', kind: 'tall', aspect: 1.1, draw: house },
  { size: 93, name: 'The Statue of Liberty', short: 'the Statue of Liberty', sizeLabel: '93 m, ground to torch', kind: 'tall', aspect: 0.4, draw: statue },
  { size: 330, name: 'The Eiffel Tower', short: 'the Eiffel Tower', sizeLabel: '330 m tall', kind: 'tall', aspect: 0.38, draw: eiffel },
  { size: 828, name: 'Burj Khalifa', short: 'Burj Khalifa', sizeLabel: '828 m tall', kind: 'tall', aspect: 0.2, draw: tower },
  { size: 8849, name: 'Mount Everest', short: 'Mount Everest', sizeLabel: '8,849 m tall', kind: 'tall', aspect: 2.2, draw: mountain },
  { size: 11000, name: 'Where jets cruise', short: 'cruising jets', sizeLabel: 'about 11 km up', kind: 'far', draw: plane },
  { size: 100000, name: 'The edge of space', short: 'the edge of space', sizeLabel: '100 km up', kind: 'far', draw: lineMark },
  { size: 400000, name: 'The Space Station', short: 'the Space Station', sizeLabel: 'orbits about 400 km up', kind: 'far', draw: station },
  { size: 12742000, name: 'Earth, side to side', short: 'the whole Earth', sizeLabel: '12,742 km across', kind: 'tall', aspect: 1, draw: earthBall },
  { size: 35786000, name: 'Weather satellites', short: 'weather satellites', sizeLabel: '35,786 km up', kind: 'far', draw: satellite },
  { size: 384400000, name: 'The Moon', short: 'the Moon', sizeLabel: '384,400 km away', kind: 'far', draw: moon },
  { size: 1.496e11, name: 'The Sun', short: 'the Sun', sizeLabel: 'about 150 million km away', kind: 'far', draw: sun },
  { size: 4.5e12, name: 'Neptune', short: 'Neptune', sizeLabel: 'about 4.5 billion km from the Sun', kind: 'far', draw: planet },
  { size: LIGHT_YEAR, name: 'One light-year', short: 'a light-year', sizeLabel: 'how far light goes in a year', kind: 'far', draw: beam },
  { size: 4.24 * LIGHT_YEAR, name: 'Proxima Centauri', short: 'the nearest star', sizeLabel: 'nearest star, 4.24 light-years', kind: 'far', draw: redStar },
  { size: 100000 * LIGHT_YEAR, name: 'The Milky Way', short: 'the Milky Way', sizeLabel: 'about 100,000 light-years across', kind: 'far', draw: galaxy('#ffa3d1') },
  { size: 2.5e6 * LIGHT_YEAR, name: 'Andromeda Galaxy', short: 'the Andromeda Galaxy', sizeLabel: 'about 2.5 million light-years away', kind: 'far', draw: galaxy('#6be3a8') },
  { size: 93e9 * LIGHT_YEAR, name: 'The observable universe', short: 'the observable universe', sizeLabel: 'about 93 billion light-years across', kind: 'far', draw: bubble },
];
