import { describe, it, expect } from 'vitest';
import { runDiff } from '../../../src/cli/diff';
import { saveProfile } from '../../../src/profile/io';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Profile } from '../../../src/profile/schema';

const mk = (statements: string[]): Profile => ({
  version: 1, scope: 'global',
  identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] },
  preferences: statements.map((s, i) => ({ id: `pref_${i}`, statement: s, confidence: 0.8, evidence: [] })),
  conventions: [], rationales: [], excluded: [],
});

describe('runDiff', () => {
  it('reports added/removed between current and previous', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-diff-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'profile.generated.yaml'), mk(['terse', 'no factories']));
      saveProfile(join(tmp, '.persona', 'previous', 'profile.20260410-0000.yaml'), mk(['terse', 'use factories']));
      const d = runDiff({ scope: 'project', projectRoot: tmp });
      expect(d.preferences.added).toContain('no factories');
      expect(d.preferences.removed).toContain('use factories');
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('treats all current statements as added when previous/ does not exist', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-diff-'));
    try {
      mkdirSync(join(tmp, '.persona'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'profile.generated.yaml'), mk(['a', 'b']));
      const d = runDiff({ scope: 'project', projectRoot: tmp });
      expect(d.preferences.added.sort()).toEqual(['a', 'b']);
      expect(d.preferences.removed).toEqual([]);
      expect(d.conventions.added).toEqual([]);
      expect(d.rationales.added).toEqual([]);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('treats all current statements as added when previous/ is empty', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-diff-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'profile.generated.yaml'), mk(['a']));
      const d = runDiff({ scope: 'project', projectRoot: tmp });
      expect(d.preferences.added).toEqual(['a']);
      expect(d.preferences.removed).toEqual([]);
      expect(d.conventions.added).toEqual([]);
      expect(d.rationales.added).toEqual([]);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('ignores non-profile files in previous/ (e.g. .DS_Store)', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-diff-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'profile.generated.yaml'), mk(['a']));
      writeFileSync(join(tmp, '.persona', 'previous', '.DS_Store'), 'junk');
      const d = runDiff({ scope: 'project', projectRoot: tmp });
      expect(d.preferences.added).toEqual(['a']);
      expect(d.preferences.removed).toEqual([]);
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
