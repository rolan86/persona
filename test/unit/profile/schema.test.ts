import { describe, it, expect } from 'vitest';
import { ProfileSchema } from '../../../src/profile/schema';

describe('ProfileSchema', () => {
  it('accepts a minimal valid profile', () => {
    const ok = ProfileSchema.safeParse({
      version: 1,
      scope: 'global',
      identity: { name: 'Test', email: 't@e.com', primary_languages: [], primary_tools: [] },
      preferences: [],
      conventions: [],
      rationales: [],
      excluded: [],
    });
    expect(ok.success).toBe(true);
  });

  it('rejects confidence above 1', () => {
    const bad = ProfileSchema.safeParse({
      version: 1,
      scope: 'global',
      identity: { name: 'Test', email: 't@e.com', primary_languages: [], primary_tools: [] },
      preferences: [{ id: 'p1', statement: 's', confidence: 1.5, evidence: [], tags: [] }],
      conventions: [],
      rationales: [],
      excluded: [],
    });
    expect(bad.success).toBe(false);
  });
});
