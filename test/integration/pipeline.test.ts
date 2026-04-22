import { describe, it, expect } from 'vitest';
import { runInit } from '../../src/cli/init';
import { runRebuild } from '../../src/cli/rebuild';
import { runEmit } from '../../src/cli/emit';
import { runDiff } from '../../src/cli/diff';
import { runRollback } from '../../src/cli/rollback';
import { loadProfile } from '../../src/profile/io';
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { LLMClient } from '../../src/synthesize/llm';
import type { SourceReader } from '../../src/ingest/types';

describe('pipeline e2e', () => {
  it('init → rebuild → emit produces CLAUDE.md with fence', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-e2e-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });
      const stubLLM: LLMClient = {
        async complete() {
          return JSON.stringify({
            preferences: [{ statement: 'Prefers terse responses', confidence: 0.9, evidence_refs: ['communication-style'], tags: [] }],
            conventions: [], rationales: [],
          });
        },
      };
      await runRebuild({
        scope: { scope: 'project', projectRoot: tmp },
        sources: [{
          name: 'claude-jsonl',
          async read() {
            return [{ source: 'claude-jsonl', sessionId: 's1', timestamp: '2026-04-10T00:00:00Z', kind: 'x', payload: { text: 'please be terse' } }];
          },
        }],
        window: { days: 90 },
        llm: stubLLM,
        identity: { name: 'T', email: 't@e.com', primary_languages: ['ts'], primary_tools: ['cc'] },
        yes: true, dryRun: false,
      });
      runEmit({ scope: 'project', projectRoot: tmp });
      const md = readFileSync(join(tmp, 'CLAUDE.md'), 'utf8');
      expect(md).toContain('PERSONA:START');
      expect(md).toContain('terse responses');
      expect(md).toContain('PERSONA:END');
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('rebuild twice then diff + rollback restores the first preference', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rollback-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });

      let call = 0;
      const stubLLM: LLMClient = {
        async complete() {
          call += 1;
          const statement = call === 1 ? 'First preference' : 'Second preference';
          return JSON.stringify({
            preferences: [{ statement, confidence: 0.9, evidence_refs: ['communication-style'], tags: [] }],
            conventions: [], rationales: [],
          });
        },
      };

      const source: SourceReader = {
        name: 'claude-jsonl',
        async read() {
          return [{ source: 'claude-jsonl', sessionId: 's1', timestamp: '2026-04-10T00:00:00Z', kind: 'x', payload: { text: 'example' } }];
        },
      };

      const scope = { scope: 'project' as const, projectRoot: tmp };
      const identity = { name: 'T', email: 't@e.com', primary_languages: ['ts'], primary_tools: ['cc'] };

      await runRebuild({
        scope, sources: [source], window: { days: 90 }, llm: stubLLM,
        identity, yes: true, dryRun: false,
      });

      await runRebuild({
        scope, sources: [source], window: { days: 90 }, llm: stubLLM,
        identity, yes: true, dryRun: false,
      });

      const genPath = join(tmp, '.persona', 'profile.generated.yaml');
      const afterSecond = loadProfile(genPath)!;
      expect(afterSecond.preferences[0].statement).toBe('Second preference');

      const previousFiles = readdirSync(join(tmp, '.persona', 'previous'));
      expect(previousFiles.length).toBeGreaterThanOrEqual(1);

      const d = runDiff(scope);
      const touchedPreferences =
        d.preferences.added.length + d.preferences.removed.length > 0;
      expect(touchedPreferences).toBe(true);

      const restored = runRollback(scope);
      expect(restored).toMatch(/^profile\./);

      const afterRollback = loadProfile(genPath)!;
      expect(afterRollback.preferences[0].statement).toBe('First preference');
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
