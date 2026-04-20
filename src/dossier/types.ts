import type { SourceKind } from '../ingest/types.js';

export interface DossierEvidence {
  source: SourceKind;
  count: number;
  first: string;         // ISO 8601
  last: string;          // ISO 8601
  examples: string[];    // short snippets, cap 20 per group
}

export interface DossierGroup {
  theme: string;         // e.g. 'communication-style', 'git-workflow'
  summary: string;
  evidence: DossierEvidence[];
  observation_ids: string[]; // format: `${source}:${sessionId}:${timestamp}`
}

export interface Dossier {
  generated_at: string;
  scope: 'global' | { project: string };
  window: { days?: number; sessions?: number };
  source_counts: Record<SourceKind, number>;
  groups: DossierGroup[];
}
