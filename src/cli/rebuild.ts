import { existsSync } from 'fs';
import { sep } from 'path';
import { runIngest } from '../ingest/index.js';
import type { Window } from '../ingest/window.js';
import type { SourceReader, Observation } from '../ingest/types.js';
import { aggregate } from '../dossier/aggregate.js';
import { saveDossier } from '../dossier/io.js';
import { synthesize } from '../synthesize/index.js';
import type { LLMClient } from '../synthesize/llm.js';
import { saveProfile, loadProfile } from '../profile/io.js';
import { snapshotProfile } from '../profile/rotate.js';
import { profileGeneratedPath, dossierPath, previousDir, type Scope } from '../paths.js';
import type { Identity } from '../profile/schema.js';

export async function runRebuild(opts: {
  scope: Scope;
  sources: SourceReader[];
  window: Window;
  llm: LLMClient;
  identity: Identity;
  yes: boolean;
  dryRun: boolean;
}): Promise<void> {
  const ingest = await runIngest({ sources: opts.sources, window: opts.window, cwd: process.cwd() });

  // Spec §3.4 / alignment note #2: when scope is project, filter JSONL/Helix observations by cwd.
  const observations = opts.scope.scope === 'project'
    ? filterByCwd(ingest.observations, opts.scope.projectRoot)
    : ingest.observations;

  const dossier = aggregate({
    observations,
    sourceCounts: ingest.sourceCounts,
    scope: opts.scope.scope === 'global' ? 'global' : { project: opts.scope.projectRoot },
    window: opts.window,
  });
  const profile = await synthesize({ dossier, client: opts.llm, identity: opts.identity });

  if (opts.dryRun) {
    console.log('[dry-run] would write profile with', profile.preferences.length, 'preferences.');
    return;
  }

  const genPath = profileGeneratedPath(opts.scope);

  if (!opts.yes) {
    const current = loadProfile(genPath);
    console.log(`\nProposed profile: ${profile.preferences.length} preferences, ${profile.conventions.length} conventions, ${profile.rationales.length} rationales.`);
    if (current) console.log(`Current profile: ${current.preferences.length} preferences.`);
    console.log('Re-run with --yes to accept.');
    return;
  }

  if (existsSync(genPath)) snapshotProfile(genPath, previousDir(opts.scope));
  saveProfile(genPath, profile);
  saveDossier(dossierPath(opts.scope), dossier);
}

function isUnderRoot(cwd: string, projectRoot: string): boolean {
  if (cwd === projectRoot) return true;
  const rootWithSep = projectRoot.endsWith(sep) ? projectRoot : projectRoot + sep;
  return cwd.startsWith(rootWithSep);
}

function filterByCwd(observations: Observation[], projectRoot: string): Observation[] {
  return observations.filter(o => {
    if (o.source === 'git-log') return true; // git source already filtered by repoPaths
    if (o.source === 'helix') return true;   // Helix observations don't carry cwd today — keep them
    const cwd = (o.payload as { cwd?: unknown } | undefined)?.cwd;
    return typeof cwd === 'string' && isUnderRoot(cwd, projectRoot);
  });
}
