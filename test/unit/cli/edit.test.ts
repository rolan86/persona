import { describe, it, expect } from 'vitest';
import { runEdit } from '../../../src/cli/edit';
import { runInit } from '../../../src/cli/init';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('runEdit', () => {
  it('returns overrides path and exists=false before init', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-edit-'));
    try {
      const r = runEdit({ scope: 'project', projectRoot: tmp });
      expect(r.path).toBe(join(tmp, '.persona', 'profile.overrides.yaml'));
      expect(r.exists).toBe(false);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('returns exists=true after init', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-edit-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });
      const r = runEdit({ scope: 'project', projectRoot: tmp });
      expect(r.path).toBe(join(tmp, '.persona', 'profile.overrides.yaml'));
      expect(r.exists).toBe(true);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('resolves the global overrides path when scope is global', () => {
    const r = runEdit({ scope: 'global' });
    expect(r.path.endsWith(join('.persona', 'profile.overrides.yaml'))).toBe(true);
  });
});
