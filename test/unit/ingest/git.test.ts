import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readGitLog } from '../../../src/ingest/git';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { simpleGit } from 'simple-git';

let repo: string;

describe('readGitLog', () => {
  beforeAll(async () => {
    repo = mkdtempSync(join(tmpdir(), 'persona-git-'));
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.name', 'Test User');
    await g.addConfig('user.email', 'test@example.com');
    writeFileSync(join(repo, 'a.txt'), 'hello');
    await g.add('a.txt');
    await g.commit('feat: add greeting');
    writeFileSync(join(repo, 'b.txt'), 'world');
    await g.add('b.txt');
    await g.commit('fix: add exclamation');
  });

  afterAll(() => { rmSync(repo, { recursive: true, force: true }); });

  it('reads commits by author email', async () => {
    const obs = await readGitLog(repo, 'test@example.com');
    expect(obs.length).toBe(2);
    expect(obs[0].source).toBe('git-log');
    expect(obs[0].kind).toBe('commit');
    expect(obs.map(o => o.payload.subject)).toContain('feat: add greeting');
  });

  it('returns empty for non-repo path', async () => {
    expect(await readGitLog('/tmp', 'test@example.com')).toEqual([]);
  });
});
