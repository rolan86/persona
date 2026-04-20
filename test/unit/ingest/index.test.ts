import { describe, it, expect } from 'vitest';
import { runIngest } from '../../../src/ingest';
import type { SourceReader, Observation, SourceKind } from '../../../src/ingest/types';

function stubSource(name: SourceKind, obs: Observation[]): SourceReader {
  return { name, read: async () => obs };
}

describe('runIngest', () => {
  it('merges observations from multiple sources', async () => {
    const a = stubSource('claude-jsonl', [
      { source: 'claude-jsonl', sessionId: '1', timestamp: '2026-04-10T00:00:00Z', kind: 'user-turn', payload: {} },
    ]);
    const b = stubSource('git-log', [
      { source: 'git-log', sessionId: 'h1', timestamp: '2026-04-09T00:00:00Z', kind: 'commit', payload: {} },
    ]);
    const result = await runIngest({ sources: [a, b], window: { days: 90 }, cwd: '/' });
    expect(result.observations.length).toBe(2);
    expect(result.sourceCounts['claude-jsonl']).toBe(1);
    expect(result.sourceCounts['git-log']).toBe(1);
  });

  it('suggests session window when day-window yields <20 observations', async () => {
    const sparse = stubSource('claude-jsonl', Array.from({ length: 5 }, (_, i) => ({
      source: 'claude-jsonl' as const,
      sessionId: `s${i}`,
      timestamp: '2026-04-10T00:00:00Z',
      kind: 'user-turn',
      payload: {},
    })));
    const r = await runIngest({ sources: [sparse], window: { days: 90 }, cwd: '/' });
    expect(r.autoExpandSuggested).toBe(true);
  });

  it('sorts observations most-recent-first when auto-expanding a sparse day-window', async () => {
    const timestamps = [
      '2026-03-01T00:00:00Z',
      '2026-04-15T00:00:00Z',
      '2026-02-10T00:00:00Z',
      '2026-04-01T00:00:00Z',
      '2026-01-05T00:00:00Z',
    ];
    const varied: Observation[] = timestamps.map((ts, i) => ({
      source: 'claude-jsonl' as const,
      sessionId: `s${i}`,
      timestamp: ts,
      kind: 'user-turn',
      payload: { i },
    }));
    const src = stubSource('claude-jsonl', varied);
    const r = await runIngest({ sources: [src], window: { days: 90 }, cwd: '/' });
    expect(r.autoExpandSuggested).toBe(true);
    expect(r.observations.length).toBe(5);
    expect(r.observations.map(o => o.timestamp)).toEqual([
      '2026-04-15T00:00:00Z',
      '2026-04-01T00:00:00Z',
      '2026-03-01T00:00:00Z',
      '2026-02-10T00:00:00Z',
      '2026-01-05T00:00:00Z',
    ]);
  });

  it('does not suggest auto-expand for a session-window even when sparse', async () => {
    const sparse = stubSource('claude-jsonl', Array.from({ length: 3 }, (_, i) => ({
      source: 'claude-jsonl' as const,
      sessionId: `s${i}`,
      timestamp: '2026-04-10T00:00:00Z',
      kind: 'user-turn',
      payload: {},
    })));
    const r = await runIngest({ sources: [sparse], window: { sessions: 500 }, cwd: '/' });
    expect(r.autoExpandSuggested).toBe(false);
    expect(r.observations.length).toBe(3);
  });
});
