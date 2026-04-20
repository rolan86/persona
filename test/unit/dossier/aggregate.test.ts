import { describe, it, expect } from 'vitest';
import { aggregate } from '../../../src/dossier/aggregate.js';
import type { Observation } from '../../../src/ingest/types.js';

const obs = (text: string, source: 'claude-jsonl' | 'git-log' = 'claude-jsonl'): Observation => ({
  source, sessionId: 's', timestamp: '2026-04-10T00:00:00Z', kind: 'x',
  payload: { text },
});

describe('aggregate', () => {
  it('produces one group per theme hit', () => {
    const d = aggregate({
      observations: [
        obs('please keep responses terse, no summaries'),
        obs('do not add fallback error handling, trust upstream'),
      ],
      sourceCounts: { 'claude-jsonl': 2, 'git-log': 0, helix: 0 },
      scope: 'global',
      window: { days: 90 },
    });
    const themes = d.groups.map(g => g.theme);
    expect(themes).toEqual(['communication-style', 'error-handling-style']);
  });

  it('caps examples at 20 per group', () => {
    const many = Array.from({ length: 50 }, () => obs('please be terse'));
    const d = aggregate({
      observations: many,
      sourceCounts: { 'claude-jsonl': 50, 'git-log': 0, helix: 0 },
      scope: 'global',
      window: { days: 90 },
    });
    const comm = d.groups.find(g => g.theme === 'communication-style')!;
    expect(comm.evidence[0].examples.length).toBeLessThanOrEqual(20);
    expect(comm.evidence[0].count).toBe(50);
  });

  it('groups evidence by source with correct chronological bounds', () => {
    const d = aggregate({
      observations: [
        { source: 'claude-jsonl', sessionId: 's1', timestamp: '2026-03-01T00:00:00Z', kind: 'user-turn', payload: { text: 'please commit more often' } },
        { source: 'claude-jsonl', sessionId: 's2', timestamp: '2026-04-01T00:00:00Z', kind: 'user-turn', payload: { text: 'small pull request preferred' } },
        { source: 'git-log', sessionId: 'abc123', timestamp: '2026-02-15T00:00:00Z', kind: 'commit', payload: { subject: 'refactor: rebase onto main' } },
      ],
      sourceCounts: { 'claude-jsonl': 2, 'git-log': 1, helix: 0 },
      scope: 'global',
      window: { days: 90 },
    });
    const git = d.groups.find(g => g.theme === 'git-workflow')!;
    expect(git.evidence).toHaveLength(2);
    const jsonl = git.evidence.find(e => e.source === 'claude-jsonl')!;
    expect(jsonl.count).toBe(2);
    expect(jsonl.first).toBe('2026-03-01T00:00:00Z');
    expect(jsonl.last).toBe('2026-04-01T00:00:00Z');
    const gitlog = git.evidence.find(e => e.source === 'git-log')!;
    expect(gitlog.count).toBe(1);
    expect(gitlog.first).toBe('2026-02-15T00:00:00Z');
    expect(gitlog.last).toBe('2026-02-15T00:00:00Z');
    expect(git.observation_ids).toEqual([
      'claude-jsonl:s1:2026-03-01T00:00:00Z',
      'claude-jsonl:s2:2026-04-01T00:00:00Z',
      'git-log:abc123:2026-02-15T00:00:00Z',
    ]);
  });
});
