export type SourceKind = 'claude-jsonl' | 'git-log' | 'helix';

export interface Observation {
  source: SourceKind;
  sessionId: string;
  timestamp: string;   // ISO 8601
  kind: string;        // e.g. 'user-turn', 'commit', 'discovery'
  payload: Record<string, unknown>;
}

export interface SourceReader {
  name: SourceKind;
  read(opts: { windowDays?: number; windowSessions?: number; cwd: string }): Promise<Observation[]>;
}
