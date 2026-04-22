import { describe, it, expect } from 'vitest';
import { mergeProfiles } from '../../../src/profile/merge';
import type { Profile } from '../../../src/profile/schema';

const base = (overrides: Partial<Profile> = {}): Profile => ({
  version: 1, scope: 'global',
  identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] },
  preferences: [], conventions: [], rationales: [], excluded: [],
  ...overrides,
});

describe('mergeProfiles', () => {
  it('union when ids differ', () => {
    const g = base({ preferences: [{ id: 'pref_001', statement: 'A', confidence: 0.8, evidence: [] }] });
    const o = base({ preferences: [{ id: 'pref_002', statement: 'B', confidence: 0.9, evidence: [] }] });
    const m = mergeProfiles(g, o);
    expect(m.preferences.length).toBe(2);
  });

  it('overrides win on id collision', () => {
    const g = base({ preferences: [{ id: 'pref_001', statement: 'generated', confidence: 0.6, evidence: [] }] });
    const o = base({ preferences: [{ id: 'pref_001', statement: 'user truth', confidence: 1.0, evidence: [] }] });
    const m = mergeProfiles(g, o);
    expect(m.preferences[0].statement).toBe('user truth');
  });

  it('uses override render_threshold when set', () => {
    const g = base();
    const o = base();
    o.render_threshold = 0.3;
    expect(mergeProfiles(g, o).render_threshold).toBe(0.3);
  });

  it('handles null overrides', () => {
    const g = base({ preferences: [{ id: 'p', statement: 'x', confidence: 0.8, evidence: [] }] });
    expect(mergeProfiles(g, null).preferences.length).toBe(1);
  });
});
