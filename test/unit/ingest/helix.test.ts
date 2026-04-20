import { describe, it, expect } from 'vitest';
import { readHelixSession } from '../../../src/ingest/helix';
import { join } from 'path';

const FIXTURE = join(__dirname, '../../fixtures/helix/session-1.json');

describe('readHelixSession', () => {
  it('returns observations for each discovery', async () => {
    const obs = await readHelixSession(FIXTURE);
    expect(obs.length).toBe(1);
    expect(obs[0].source).toBe('helix');
    expect(obs[0].kind).toBe('discovery');
    expect(obs[0].payload.text).toContain('factory pattern');
  });

  it('skips missing file silently', async () => {
    expect(await readHelixSession('/nope.json')).toEqual([]);
  });
});
