import { describe, it, expect } from 'vitest';
import { LLMOutputSchema } from '../../../src/synthesize/schema.js';

describe('LLMOutputSchema', () => {
  it('accepts a valid LLM output', () => {
    const ok = LLMOutputSchema.safeParse({
      preferences: [{ statement: 'terse', confidence: 0.8, evidence_refs: ['communication-style'], tags: [] }],
      conventions: [],
      rationales: [],
    });
    expect(ok.success).toBe(true);
  });
  it('rejects confidence out of range', () => {
    const bad = LLMOutputSchema.safeParse({
      preferences: [{ statement: 'x', confidence: 1.1, evidence_refs: [], tags: [] }],
      conventions: [],
      rationales: [],
    });
    expect(bad.success).toBe(false);
  });
  it('accepts inclusive confidence bounds 0 and 1', () => {
    const low = LLMOutputSchema.safeParse({
      preferences: [{ statement: 'x', confidence: 0, evidence_refs: [], tags: [] }],
      conventions: [], rationales: [],
    });
    const high = LLMOutputSchema.safeParse({
      preferences: [{ statement: 'x', confidence: 1, evidence_refs: [], tags: [] }],
      conventions: [], rationales: [],
    });
    expect(low.success).toBe(true);
    expect(high.success).toBe(true);
  });

  it('rejects empty statement', () => {
    const bad = LLMOutputSchema.safeParse({
      preferences: [{ statement: '', confidence: 0.5, evidence_refs: [], tags: [] }],
      conventions: [], rationales: [],
    });
    expect(bad.success).toBe(false);
  });

  it('rejects missing required field', () => {
    const bad = LLMOutputSchema.safeParse({
      preferences: [{ statement: 'x', confidence: 0.5, tags: [] }],  // no evidence_refs
      conventions: [], rationales: [],
    });
    expect(bad.success).toBe(false);
  });
});
