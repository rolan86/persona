import type { Observation, SourceReader, SourceKind } from './types.js';
import type { Window } from './window.js';

export interface IngestResult {
  observations: Observation[];
  sourceCounts: Record<SourceKind, number>;
  autoExpandSuggested: boolean;
}

const MIN_OBSERVATIONS = 20;
const AUTO_EXPAND_MAX = 500;

export async function runIngest(opts: {
  sources: SourceReader[];
  window: Window;
  cwd: string;
}): Promise<IngestResult> {
  const observations: Observation[] = [];
  const sourceCounts: Record<SourceKind, number> = {
    'claude-jsonl': 0,
    'git-log': 0,
    helix: 0,
  };
  const windowDays = 'days' in opts.window ? opts.window.days : undefined;
  const windowSessions = 'sessions' in opts.window ? opts.window.sessions : undefined;
  const isDayWindow = windowDays !== undefined;

  for (const src of opts.sources) {
    const part = await src.read({ windowDays, windowSessions, cwd: opts.cwd });
    observations.push(...part);
    sourceCounts[src.name] += part.length;
  }

  // Spec §3.3: auto-expand sparse day-windows
  const autoExpandSuggested = isDayWindow && observations.length < MIN_OBSERVATIONS;

  let finalObservations = observations;
  if (autoExpandSuggested) {
    finalObservations = [...observations]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, AUTO_EXPAND_MAX);
  }

  return {
    observations: finalObservations,
    sourceCounts,
    autoExpandSuggested,
  };
}
