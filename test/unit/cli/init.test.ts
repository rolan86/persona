import { describe, it, expect } from 'vitest';
import { runInit } from '../../../src/cli/init';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('runInit', () => {
  it('creates .persona with empty overrides.yaml and gitignore', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-init-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });
      expect(existsSync(join(tmp, '.persona'))).toBe(true);
      expect(existsSync(join(tmp, '.persona', 'profile.overrides.yaml'))).toBe(true);
      const gi = readFileSync(join(tmp, '.persona', '.gitignore'), 'utf8');
      expect(gi).toContain('profile.generated.yaml');
      expect(gi).toContain('profile.overrides.yaml');
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('share: true tracks overrides.yaml (smaller gitignore)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-init-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: true });
      const gi = readFileSync(join(tmp, '.persona', '.gitignore'), 'utf8');
      expect(gi).not.toContain('profile.overrides.yaml');
      expect(gi).toContain('dossier.json');
      expect(gi).toContain('previous/');
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
