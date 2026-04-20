import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { Observation, SourceReader } from './types.js';

export async function readHelixSession(path: string): Promise<Observation[]> {
  if (!existsSync(path)) return [];
  let data: any;
  try { data = JSON.parse(readFileSync(path, 'utf8')); } catch { return []; }
  const discoveries: any[] = Array.isArray(data.discoveries) ? data.discoveries : [];
  return discoveries.map((d) => ({
    source: 'helix' as const,
    sessionId: String(data.sessionId ?? ''),
    timestamp: String(data.startedAt ?? ''),
    kind: 'discovery',
    payload: { text: d?.text ?? '', discoveryKind: d?.kind ?? 'unknown' },
  }));
}

export function createHelixSource(sessionsDir: string): SourceReader {
  return {
    name: 'helix',
    async read() {
      if (!existsSync(sessionsDir)) return [];
      const entries = await readdir(sessionsDir);
      const all: Observation[] = [];
      for (const e of entries) if (e.endsWith('.json')) all.push(...(await readHelixSession(join(sessionsDir, e))));
      return all;
    },
  };
}
