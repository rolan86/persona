import { describe, it, expect } from 'vitest';
import { saveProfile, loadProfile } from '../../../src/profile/io';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Profile } from '../../../src/profile/schema';

describe('profile io', () => {
  it('round-trips via YAML and validates schema', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-prof-'));
    try {
      const path = join(tmp, 'profile.yaml');
      const p: Profile = {
        version: 1, scope: 'global',
        identity: { name: 'T', email: 't@e.com', primary_languages: ['ts'], primary_tools: ['cc'] },
        preferences: [{ id: 'pref_001', statement: 'terse', confidence: 0.8, evidence: [], tags: [] }],
        conventions: [], rationales: [], excluded: [],
      };
      saveProfile(path, p);
      expect(loadProfile(path)?.preferences[0].statement).toBe('terse');
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('returns null for missing file', () => {
    expect(loadProfile('/nope.yaml')).toBeNull();
  });

  it('throws on invalid file contents', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-prof-'));
    try {
      const path = join(tmp, 'bad.yaml');
      writeFileSync(path, 'version: 99\nscope: oops\n');
      expect(() => loadProfile(path)).toThrow(/bad\.yaml/);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('throws with path context on malformed YAML', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-prof-'));
    try {
      const path = join(tmp, 'broken.yaml');
      writeFileSync(path, 'version: 1\n  key: [unclosed\n');
      expect(() => loadProfile(path)).toThrow(/Malformed YAML at .*broken\.yaml/);
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
