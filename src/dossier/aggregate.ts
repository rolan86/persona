import type { Observation, SourceKind } from '../ingest/types.js';
import type { Dossier, DossierGroup, DossierEvidence } from './types.js';

const EXAMPLES_PER_GROUP = 20;
const EXAMPLE_CHAR_LIMIT = 200;

const extractText = (o: Observation): string =>
  typeof o.payload?.text === 'string' ? o.payload.text
  : typeof o.payload?.subject === 'string' ? o.payload.subject
  : '';

interface Theme {
  name: string;
  summary: string;
  matches: (text: string) => boolean;
}

const THEMES: Theme[] = [
  {
    name: 'communication-style',
    summary: 'Preferences about response length, tone, summaries.',
    matches: (t) => /\b(terse|brief|concise|no (preamble|summary|summaries)|stop summariz)/i.test(t),
  },
  {
    name: 'error-handling-style',
    summary: 'Preferences about error handling, fallbacks, validation.',
    matches: (t) => /\b(no fallback|don't (catch|swallow|add fallback)|no error handling|fail loud|trust(ed)? (the )?(caller|upstream|types?))/i.test(t),
  },
  {
    name: 'abstraction-level',
    summary: 'Preferences about factories, abstractions, premature generalization.',
    matches: (t) => /\b(factor(y|ies)|abstraction|yagni|premature|over-engineer)/i.test(t),
  },
  {
    name: 'commenting-style',
    summary: 'Preferences about comments, documentation, docstrings.',
    matches: (t) => /\b(no comments?|don't comment|remove comments?|rot|docstring)/i.test(t),
  },
  {
    name: 'testing-style',
    summary: 'Preferences about test design, TDD, coverage.',
    matches: (t) => /\b(tdd|test-driven|unit test|integration test|mock|fixture)/i.test(t),
  },
  {
    name: 'git-workflow',
    summary: 'Preferences about commits, branches, PRs.',
    matches: (t) => /\b(commit|branch|merge|rebase|push|pr\b|pull request)/i.test(t),
  },
];

export function aggregate(opts: {
  observations: Observation[];
  sourceCounts: Record<SourceKind, number>;
  scope: Dossier['scope'];
  window: Dossier['window'];
}): Dossier {
  const groups: DossierGroup[] = [];
  for (const theme of THEMES) {
    const hits = opts.observations.filter((o) => {
      const text = extractText(o);
      return text && theme.matches(text);
    });
    if (hits.length === 0) continue;
    const bySource = new Map<SourceKind, Observation[]>();
    for (const h of hits) {
      const arr = bySource.get(h.source) ?? [];
      arr.push(h);
      bySource.set(h.source, arr);
    }
    const evidence: DossierEvidence[] = [];
    for (const [src, list] of bySource) {
      const sorted = list.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      evidence.push({
        source: src,
        count: list.length,
        first: sorted[0].timestamp,
        last: sorted[sorted.length - 1].timestamp,
        examples: sorted.slice(0, EXAMPLES_PER_GROUP).map(o => {
          const text = extractText(o);
          return text.length > EXAMPLE_CHAR_LIMIT ? text.slice(0, EXAMPLE_CHAR_LIMIT) + '…' : text;
        }),
      });
    }
    groups.push({
      theme: theme.name,
      summary: theme.summary,
      evidence,
      observation_ids: hits.map(h => `${h.source}:${h.sessionId}:${h.timestamp}`),
    });
  }
  return {
    generated_at: new Date().toISOString(),
    scope: opts.scope,
    window: opts.window,
    source_counts: opts.sourceCounts,
    groups,
  };
}
