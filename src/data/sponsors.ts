import { SPONSORS_ENABLED } from '../config/site';

export type SponsorPlacement = 'home-grid' | 'game-bar' | 'footer';

export interface Sponsor {
  name: string;
  text: string;
  url: string;
  emoji?: string;
  logo?: string; // path under /public, e.g. /sponsors/acme.svg
  placements: SponsorPlacement[];
}

// Empty until slots are sold.
export const SPONSORS: Sponsor[] = [];

export function sponsorsFor(placement: SponsorPlacement): Sponsor[] {
  if (!SPONSORS_ENABLED) return [];
  return SPONSORS.filter((s) => s.placements.includes(placement));
}
