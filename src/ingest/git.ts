import { existsSync } from 'fs';
import { join } from 'path';
import { simpleGit } from 'simple-git';
import type { Observation, SourceReader } from './types.js';

export async function readGitLog(repoPath: string, authorEmail: string): Promise<Observation[]> {
  if (!existsSync(join(repoPath, '.git'))) return [];
  const git = simpleGit(repoPath);
  const log = await git.log({ '--author': authorEmail, '--no-merges': null });
  return log.all.map((c) => ({
    source: 'git-log' as const,
    sessionId: c.hash,
    timestamp: c.date,
    kind: 'commit',
    payload: {
      subject: c.message,
      body: c.body ?? '',
      repo: repoPath,
    },
  }));
}

export function createGitSource(repoPaths: string[], authorEmail: string): SourceReader {
  return {
    name: 'git-log',
    async read() {
      const all: Observation[] = [];
      for (const p of repoPaths) all.push(...(await readGitLog(p, authorEmail)));
      return all;
    },
  };
}
