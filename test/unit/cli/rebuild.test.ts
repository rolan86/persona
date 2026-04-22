import { describe, it, expect } from 'vitest';
import { runRebuild } from '../../../src/cli/rebuild';
import { runInit } from '../../../src/cli/init';
import { mkdtempSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { LLMClient } from '../../../src/synthesize/llm';

describe('runRebuild', () => {
  it('writes generated profile and dossier given stub sources + stub LLM', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rebuild-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });
      const stubLLM: LLMClient = {
        async complete() {
          return JSON.stringify({
            preferences: [{ statement: 'terse', confidence: 0.9, evidence_refs: ['communication-style'], tags: [] }],
            conventions: [], rationales: [],
          });
        },
      };
      await runRebuild({
        scope: { scope: 'project', projectRoot: tmp },
        sources: [{
          name: 'claude-jsonl',
          async read() {
            return [{ source: 'claude-jsonl', sessionId: 's', timestamp: '2026-04-10T00:00:00Z', kind: 'x', payload: { text: 'terse please', cwd: tmp } }];
          },
        }],
        window: { days: 90 },
        llm: stubLLM,
        identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] },
        yes: true, dryRun: false,
      });
      expect(existsSync(join(tmp, '.persona', 'profile.generated.yaml'))).toBe(true);
      expect(existsSync(join(tmp, '.persona', 'dossier.json'))).toBe(true);
    } finally { rmSync(tmp, { recursive: true }); }
  });

  it('dry-run writes nothing', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-rebuild-'));
    try {
      runInit({ scope: 'project', projectRoot: tmp, share: false });
      const stubLLM: LLMClient = {
        async complete() { return JSON.stringify({ preferences: [], conventions: [], rationales: [] }); },
      };
      await runRebuild({
        scope: { scope: 'project', projectRoot: tmp },
        sources: [],
        window: { days: 90 },
        llm: stubLLM,
        identity: { name: 'T', email: 't@e.com', primary_languages: [], primary_tools: [] },
        yes: true, dryRun: true,
      });
      expect(existsSync(join(tmp, '.persona', 'profile.generated.yaml'))).toBe(false);
    } finally { rmSync(tmp, { recursive: true }); }
  });
});
