import { describe, it, expect } from 'vitest';
import { runStatus } from '../../../src/cli/status';
import { runInit } from '../../../src/cli/init';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('runStatus', () => {
  it('returns summary after init', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-status-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });
      const s = runStatus({ scope: 'project', projectRoot: tmp });
      expect(s.personaDir).toBe(join(tmp, '.persona'));
      expect(s.hasGenerated).toBe(false);
      expect(s.hasDossier).toBe(false);
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
