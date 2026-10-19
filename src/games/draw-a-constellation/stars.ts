export interface Constellation {
  id: string;
  name: string;
  /** x, y in 0–100, brighter stars are larger. Positions are a simplified stick-figure map, not a sky chart. */
  stars: { x: number; y: number; m: number }[];
  lines: [number, number][];
}

export const CONSTELLATIONS: Constellation[] = [
  { id: 'orion', name: 'Orion', stars: [{ x: 38, y: 22, m: 1 }, { x: 62, y: 24, m: 1 }, { x: 30, y: 48, m: 2 }, { x: 50, y: 50, m: 3 }, { x: 70, y: 46, m: 2 }, { x: 34, y: 78, m: 1 }, { x: 66, y: 80, m: 1 }], lines: [[0, 2], [2, 5], [1, 4], [4, 6], [2, 3], [3, 4]] },
  { id: 'dipper', name: 'The Big Dipper', stars: [{ x: 18, y: 62, m: 2 }, { x: 32, y: 48, m: 2 }, { x: 48, y: 42, m: 2 }, { x: 62, y: 50, m: 2 }, { x: 70, y: 34, m: 2 }, { x: 82, y: 28, m: 2 }, { x: 78, y: 48, m: 2 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { id: 'cass', name: 'Cassiopeia', stars: [{ x: 12, y: 40, m: 2 }, { x: 30, y: 62, m: 2 }, { x: 50, y: 36, m: 1 }, { x: 70, y: 64, m: 2 }, { x: 88, y: 38, m: 2 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { id: 'cygnus', name: 'Cygnus', stars: [{ x: 50, y: 16, m: 1 }, { x: 50, y: 40, m: 2 }, { x: 50, y: 62, m: 2 }, { x: 50, y: 84, m: 2 }, { x: 24, y: 48, m: 2 }, { x: 76, y: 46, m: 2 }], lines: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]] },
  { id: 'leo', name: 'Leo', stars: [{ x: 22, y: 30, m: 1 }, { x: 36, y: 42, m: 2 }, { x: 28, y: 58, m: 2 }, { x: 42, y: 62, m: 2 }, { x: 58, y: 58, m: 2 }, { x: 74, y: 50, m: 2 }, { x: 86, y: 36, m: 1 }], lines: [[0, 1], [1, 2], [2, 3], [3, 1], [3, 4], [4, 5], [5, 6]] },
  { id: 'scorpius', name: 'Scorpius', stars: [{ x: 30, y: 18, m: 2 }, { x: 42, y: 22, m: 2 }, { x: 50, y: 34, m: 1 }, { x: 46, y: 50, m: 2 }, { x: 40, y: 64, m: 2 }, { x: 48, y: 76, m: 2 }, { x: 64, y: 82, m: 2 }], lines: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
  { id: 'lyra', name: 'Lyra', stars: [{ x: 50, y: 16, m: 1 }, { x: 36, y: 42, m: 2 }, { x: 64, y: 42, m: 2 }, { x: 34, y: 70, m: 2 }, { x: 66, y: 72, m: 2 }], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [1, 2], [3, 4]] },
  { id: 'crux', name: 'Crux', stars: [{ x: 50, y: 16, m: 1 }, { x: 50, y: 78, m: 2 }, { x: 22, y: 48, m: 2 }, { x: 78, y: 52, m: 1 }], lines: [[0, 1], [2, 3]] },
  { id: 'pegasus', name: 'The Great Square', stars: [{ x: 28, y: 28, m: 2 }, { x: 72, y: 26, m: 2 }, { x: 76, y: 72, m: 2 }, { x: 30, y: 74, m: 2 }], lines: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  { id: 'aquila', name: 'Aquila', stars: [{ x: 50, y: 48, m: 1 }, { x: 28, y: 36, m: 2 }, { x: 72, y: 34, m: 2 }, { x: 50, y: 22, m: 3 }, { x: 50, y: 74, m: 2 }], lines: [[1, 0], [0, 2], [3, 0], [0, 4]] },
  { id: 'gemini', name: 'Gemini', stars: [{ x: 30, y: 18, m: 1 }, { x: 68, y: 20, m: 1 }, { x: 34, y: 40, m: 2 }, { x: 64, y: 42, m: 2 }, { x: 38, y: 64, m: 2 }, { x: 60, y: 66, m: 2 }, { x: 42, y: 84, m: 3 }, { x: 56, y: 84, m: 3 }], lines: [[0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7]] },
  { id: 'taurus', name: 'Taurus', stars: [{ x: 22, y: 40, m: 1 }, { x: 40, y: 34, m: 2 }, { x: 56, y: 42, m: 2 }, { x: 48, y: 56, m: 2 }, { x: 34, y: 58, m: 2 }, { x: 70, y: 28, m: 2 }, { x: 82, y: 22, m: 2 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5], [5, 6]] },
];
