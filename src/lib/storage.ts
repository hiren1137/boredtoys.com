// Every storage access is wrapped so games keep working when storage is blocked.
const PREFIX = 'gs:';

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function getBest(slug: string): number | null {
  const v = getJSON<number | null>(`best:${slug}`, null);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Saves the score if it beats the stored best.
 * `lowerIsBetter` is for times; returns whether a new best was set and the best after saving.
 */
export function saveBest(
  slug: string,
  score: number,
  lowerIsBetter = false,
): { best: number; isNewBest: boolean } {
  const prev = getBest(slug);
  const better = prev == null || (lowerIsBetter ? score < prev : score > prev);
  if (better) setJSON(`best:${slug}`, score);
  return { best: better ? score : (prev as number), isNewBest: better };
}
