import { describe, it, expect } from 'vitest';
import { saveDossier, loadDossier } from '../../../src/dossier/io';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('dossier io', () => {
  it('round-trips a dossier through disk', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-dossier-'));
    try {
      const path = join(tmp, 'dossier.json');
      saveDossier(path, {
        generated_at: '2026-04-18T00:00:00Z',
        scope: 'global',
        window: { days: 90 },
        source_counts: { 'claude-jsonl': 1, 'git-log': 0, helix: 0 },
        groups: [],
      });
      const back = loadDossier(path);
      expect(back?.scope).toBe('global');
      expect(back?.source_counts['claude-jsonl']).toBe(1);
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it('returns null for missing file', () => {
    expect(loadDossier('/nope.json')).toBeNull();
  });
});
