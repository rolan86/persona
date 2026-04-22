#!/usr/bin/env node
import { Command } from 'commander';
import { detectScope } from './scope.js';
import { runInit } from './cli/init.js';
import { runStatus } from './cli/status.js';

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

program.parseAsync().catch((e) => { console.error(e.message); process.exit(1); });
