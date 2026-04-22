import { describe, it, expect } from 'vitest';
import { runRollback } from '../../../src/cli/rollback';
import { saveProfile, loadProfile } from '../../../src/profile/io';
import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Profile } from '../../../src/profile/schema';

const mk = (statements: string[]): Profile => ({
  version: 1, scope: 'global',
  identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] },
  preferences: statements.map((s, i) => ({ id: `pref_${i}`, statement: s, confidence: 0.8, evidence: [] })),
  conventions: [], rationales: [], excluded: [],
});

describe('runRollback', () => {
  it('restores the most recent previous profile by default', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rollback-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'profile.generated.yaml'), mk(['current']));
      saveProfile(join(tmp, '.persona', 'previous', 'profile.20260410-0000.yaml'), mk(['older']));
      saveProfile(join(tmp, '.persona', 'previous', 'profile.20260415-1200.yaml'), mk(['newer']));
      const restored = runRollback({ scope: 'project', projectRoot: tmp });
      expect(restored).toBe('profile.20260415-1200.yaml');
      const p = loadProfile(join(tmp, '.persona', 'profile.generated.yaml'));
      expect(p?.preferences[0].statement).toBe('newer');
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('restores by substring match when --to given', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rollback-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'profile.generated.yaml'), mk(['current']));
      saveProfile(join(tmp, '.persona', 'previous', 'profile.20260410-0000.yaml'), mk(['older']));
      saveProfile(join(tmp, '.persona', 'previous', 'profile.20260415-1200.yaml'), mk(['newer']));
      const restored = runRollback({ scope: 'project', projectRoot: tmp }, '20260410');
      expect(restored).toBe('profile.20260410-0000.yaml');
      const p = loadProfile(join(tmp, '.persona', 'profile.generated.yaml'));
      expect(p?.preferences[0].statement).toBe('older');
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('throws when previous dir does not exist', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rollback-'));
    try {
      expect(() => runRollback({ scope: 'project', projectRoot: tmp })).toThrow(/No previous profiles/);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('throws when previous dir is empty', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rollback-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      expect(() => runRollback({ scope: 'project', projectRoot: tmp })).toThrow(/No previous profiles/);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('throws when --to does not match', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rollback-'));
    try {
      mkdirSync(join(tmp, '.persona', 'previous'), { recursive: true });
      saveProfile(join(tmp, '.persona', 'previous', 'profile.20260410-0000.yaml'), mk(['older']));
      expect(() => runRollback({ scope: 'project', projectRoot: tmp }, 'nonexistent')).toThrow(/No previous profile matching/);
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
