// Node-side reader for game content files, shared by astro.config, validation and the scaffolder.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_DIR = join(ROOT, 'src', 'content', 'games');

export function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  return { data: parse(m[1]) ?? {}, body: m[2] };
}

export function readGames() {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(CONTENT_DIR, file), 'utf8');
      const { data, body } = splitFrontmatter(raw);
      return { file, data, body };
    });
}
