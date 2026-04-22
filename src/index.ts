#!/usr/bin/env node
import { Command } from 'commander';
import { detectScope } from './scope.js';
import { runInit } from './cli/init.js';
import { runStatus } from './cli/status.js';
import { runRebuild } from './cli/rebuild.js';
import { runDossierCmd } from './cli/dossier.js';
import { runEmit } from './cli/emit.js';
import { runEdit } from './cli/edit.js';
import { runDiff } from './cli/diff.js';
import { runRollback } from './cli/rollback.js';
import { createAnthropicClient } from './synthesize/index.js';
import { parseWindow } from './ingest/window.js';
import { jsonlSource } from './ingest/jsonl.js';
import { createGitSource } from './ingest/git.js';
import { createHelixSource } from './ingest/helix.js';
import { loadProfile } from './profile/io.js';
import { profileOverridesPath } from './paths.js';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { SourceReader } from './ingest/types.js';

const program = new Command();
program.name('persona').description('Build a typed Profile of your coding preferences').version('0.1.0');

program.command('init')
  .description('Create .persona/ with empty overrides')
  .option('--share', 'Track overrides in git (for per-project shared profiles)', false)
  .option('--scope <s>', 'global | project')
  .action((opts) => {
    const scope = detectScope(process.cwd(), opts.scope);
    if (scope.scope === 'global' && opts.share) throw new Error('--share only valid with --scope project');
    runInit({ ...scope, share: opts.share });
    console.log(`Initialized persona at ${scope.scope === 'global' ? '~/.persona' : scope.projectRoot + '/.persona'}`);
  });

program.command('status')
  .description('Print scope, last rebuild time, paths')
  .option('--scope <s>', 'global | project')
  .action((opts) => {
    const scope = detectScope(process.cwd(), opts.scope);
    const s = runStatus(scope);
    console.log(JSON.stringify(s, null, 2));
  });

program.command('rebuild')
  .option('--scope <s>', 'global | project')
  .option('--window <w>', 'e.g. 90d or 500s', '90d')
  .option('--no-jsonl')
  .option('--no-git')
  .option('--no-helix')
  .option('-y, --yes', 'auto-accept new profile', false)
  .option('--dry-run', '', false)
  .action(async (opts) => {
    const scope = detectScope(process.cwd(), opts.scope);
    const overrides = loadProfile(profileOverridesPath(scope));
    if (!overrides) throw new Error('Run `persona init` first.');
    const sources: SourceReader[] = [];
    if (opts.jsonl !== false) sources.push(jsonlSource);
    // Spec-alignment note #3: skip git source when identity.email is empty
    if (opts.git !== false) {
      if (!overrides.identity.email) {
        console.warn('Git source skipped: set identity.email in overrides.yaml');
      } else {
        sources.push(createGitSource([process.cwd()], overrides.identity.email));
      }
    }
    if (opts.helix !== false) {
      const helixDir = process.env.PERSONA_HELIX_DIR ?? join(homedir(), 'Desktop/Projects/helix/data/sessions');
      if (existsSync(helixDir)) {
        sources.push(createHelixSource(helixDir));
      } else {
        console.warn(`Helix source skipped: ${helixDir} not found (set PERSONA_HELIX_DIR to override).`);
      }
    }
    await runRebuild({
      scope, sources, window: parseWindow(opts.window),
      llm: createAnthropicClient(), identity: overrides.identity,
      yes: opts.yes, dryRun: opts.dryRun,
    });
  });

program.command('dossier')
  .option('--scope <s>', 'global | project')
  .option('--pretty', '', false)
  .action((opts) => {
    const scope = detectScope(process.cwd(), opts.scope);
    const d = runDossierCmd(scope);
    if (!d) { console.log('No dossier yet — run persona rebuild.'); return; }
    console.log(opts.pretty ? JSON.stringify(d, null, 2) : JSON.stringify(d));
  });

program.command('emit')
  .option('--scope <s>', 'global | project')
  .action((opts) => {
    const scope = detectScope(process.cwd(), opts.scope);
    runEmit(scope);
    console.log('Emitted CLAUDE.md');
  });

program.command('edit')
  .option('--scope <s>', 'global | project')
  .action((opts) => {
    const { path, exists } = runEdit(detectScope(process.cwd(), opts.scope));
    console.log(`Open this file in your editor:\n  ${path}`);
    if (!exists) console.log('(File does not exist yet — run `persona init` first.)');
  });

program.command('diff')
  .option('--scope <s>', 'global | project')
  .action((opts) => {
    console.log(JSON.stringify(runDiff(detectScope(process.cwd(), opts.scope)), null, 2));
  });

program.command('rollback')
  .option('--scope <s>', 'global | project')
  .option('--to <timestamp>', 'substring of a previous profile filename (default: most recent)')
  .action((opts) => {
    const restored = runRollback(detectScope(process.cwd(), opts.scope), opts.to);
    console.log(`Restored ${restored}`);
  });

program.parseAsync().catch((e) => { console.error(e.message); process.exit(1); });
