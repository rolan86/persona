import { describe, it, expect } from 'vitest';
import { synthesize } from '../../../src/synthesize/index.js';
import type { Dossier } from '../../../src/dossier/types.js';

const sampleDossier: Dossier = {
  generated_at: '2026-04-18T00:00:00Z',
  scope: 'global',
  window: { days: 90 },
  source_counts: { 'claude-jsonl': 5, 'git-log': 2, helix: 0 },
  groups: [{
    theme: 'communication-style',
    summary: 'Preferences about response length.',
    evidence: [{ source: 'claude-jsonl', count: 5, first: 'x', last: 'y', examples: ['terse please'] }],
    observation_ids: [],
  }],
};

describe('synthesize', () => {
  it('validates LLM output against schema and assigns ids', async () => {
    const stubClient = {
      async complete() {
        return JSON.stringify({
          preferences: [{ statement: 'terse', confidence: 0.8, evidence_refs: ['communication-style'], tags: [] }],
          conventions: [],
          rationales: [],
        });
      },
    };
    const profile = await synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } });
    expect(profile.preferences[0].statement).toBe('terse');
    expect(profile.preferences[0].id).toMatch(/^pref_/);
  });

  it('routes low-confidence statements to excluded', async () => {
    const stubClient = {
      async complete() {
        return JSON.stringify({
          preferences: [{ statement: 'maybe', confidence: 0.3, evidence_refs: [], tags: [] }],
          conventions: [], rationales: [],
        });
      },
    };
    const profile = await synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } });
    expect(profile.preferences.length).toBe(0);
    expect(profile.excluded.length).toBe(1);
  });

  it('throws on malformed LLM output', async () => {
    const badClient = { async complete() { return 'not json'; } };
    await expect(synthesize({ dossier: sampleDossier, client: badClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } }))
      .rejects.toThrow();
  });

  it('resolves evidence_refs against dossier groups', async () => {
    const stubClient = {
      async complete() {
        return JSON.stringify({
          preferences: [{ statement: 'terse', confidence: 0.8, evidence_refs: ['communication-style'], tags: [] }],
          conventions: [], rationales: [],
        });
      },
    };
    const profile = await synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } });
    expect(profile.preferences[0].evidence).toEqual([
      { source: 'claude-jsonl', count: 5, first: 'x', last: 'y', examples: ['terse please'] },
    ]);
  });

  it('silently drops unresolved evidence_refs', async () => {
    const stubClient = {
      async complete() {
        return JSON.stringify({
          preferences: [{ statement: 'terse', confidence: 0.8, evidence_refs: ['communication-style', 'nonexistent-theme'], tags: [] }],
          conventions: [], rationales: [],
        });
      },
    };
    const profile = await synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } });
    expect(profile.preferences[0].evidence).toHaveLength(1);
    expect(profile.preferences[0].evidence[0].source).toBe('claude-jsonl');
  });

  it('treats confidence === 0.5 as active (inclusive lower bound)', async () => {
    const stubClient = {
      async complete() {
        return JSON.stringify({
          preferences: [{ statement: 'borderline', confidence: 0.5, evidence_refs: [], tags: [] }],
          conventions: [], rationales: [],
        });
      },
    };
    const profile = await synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } });
    expect(profile.preferences).toHaveLength(1);
    expect(profile.excluded).toHaveLength(0);
  });

  it('throws on schema violation (valid JSON, invalid shape)', async () => {
    const stubClient = { async complete() { return JSON.stringify({ preferences: [{ statement: 'x', confidence: 1.5, evidence_refs: [], tags: [] }], conventions: [], rationales: [] }); } };
    await expect(synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } }))
      .rejects.toThrow(/schema/i);
  });

  it('assigns sequential zero-padded IDs to multiple statements', async () => {
    const stubClient = {
      async complete() {
        return JSON.stringify({
          preferences: [
            { statement: 'a', confidence: 0.8, evidence_refs: [], tags: [] },
            { statement: 'b', confidence: 0.8, evidence_refs: [], tags: [] },
          ],
          conventions: [], rationales: [],
        });
      },
    };
    const profile = await synthesize({ dossier: sampleDossier, client: stubClient, identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] } });
    expect(profile.preferences.map(p => p.id)).toEqual(['pref_001', 'pref_002']);
  });
});
