import { describe, it, expect } from 'vitest';
import { emitToClaudeMd } from '../../../src/emit';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Profile } from '../../../src/profile/schema';

const baseProfile: Profile = {
  version: 1, scope: 'global',
  identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] },
  preferences: [{ id: 'pref_001', statement: 'terse', confidence: 0.9, evidence: [] }],
  conventions: [], rationales: [], excluded: [],
};

describe('emitToClaudeMd', () => {
  it('creates CLAUDE.md with fence when absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'persona-emit-'));
    try {
      const path = join(dir, 'CLAUDE.md');
      emitToClaudeMd({ path, profile: baseProfile });
      const out = readFileSync(path, 'utf8');
      expect(out).toContain('PERSONA:START');
      expect(out).toContain('terse');
    } finally { rmSync(dir, { recursive: true }); }
  });

  it('preserves user content outside fence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'persona-emit-'));
    try {
      const path = join(dir, 'CLAUDE.md');
      writeFileSync(path, '# My own instructions\n\nBe kind.\n');
      emitToClaudeMd({ path, profile: baseProfile });
      const out = readFileSync(path, 'utf8');
      expect(out).toContain('My own instructions');
      expect(out).toContain('Be kind.');
      expect(out).toContain('PERSONA:START');
    } finally { rmSync(dir, { recursive: true }); }
  });
});
