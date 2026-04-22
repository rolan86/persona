import { describe, it, expect } from 'vitest';
import { renderProfile } from '../../../src/emit/render';
import type { Profile } from '../../../src/profile/schema';

const profile: Profile = {
  version: 1, scope: 'global',
  identity: { name: 'Test', email: 't@e.com', primary_languages: ['typescript'], primary_tools: ['claude-code'] },
  preferences: [
    { id: 'pref_001', statement: 'Prefers terse responses.', confidence: 0.9, evidence: [], tags: ['communication'] },
    { id: 'pref_002', statement: 'Hidden low confidence.', confidence: 0.3, evidence: [] },
  ],
  conventions: [
    { id: 'conv_001', statement: 'Tests alongside source.', confidence: 0.8, evidence: [] },
  ],
  rationales: [],
  excluded: [],
};

describe('renderProfile', () => {
  it('produces stable markdown', () => {
    const out = renderProfile(profile);
    expect(out).toMatchSnapshot();
  });

  it('filters below render_threshold', () => {
    const out = renderProfile(profile);
    expect(out).toContain('terse responses');
    expect(out).not.toContain('Hidden low confidence');
  });

  it('respects custom render_threshold', () => {
    const out = renderProfile({ ...profile, render_threshold: 0.2 });
    expect(out).toContain('Hidden low confidence');
  });
});
