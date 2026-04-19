import { describe, it, expect } from 'vitest';
import { readJsonlFile } from '../../../src/ingest/jsonl';
import { join } from 'path';

const FIXTURE = join(__dirname, '../../fixtures/jsonl/sample-session.jsonl');

describe('readJsonlFile', () => {
  it('returns an observation per user turn only', async () => {
    const obs = await readJsonlFile(FIXTURE);
    expect(obs.length).toBe(2);
    expect(obs[0].source).toBe('claude-jsonl');
    expect(obs[0].sessionId).toBe('abc-1');
    expect(obs[0].kind).toBe('user-turn');
    expect(obs[0].payload.text).toContain('terse responses');
  });

  it('returns empty array for missing file', async () => {
    expect(await readJsonlFile('/nope/missing.jsonl')).toEqual([]);
  });
});
