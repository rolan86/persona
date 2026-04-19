import { existsSync } from 'fs';
import { dirname, join, parse, resolve } from 'path';
import type { Scope } from './paths.js';

export function detectScope(cwd: string, forced?: 'global' | 'project'): Scope {
  if (forced === 'global') return { scope: 'global' };
  const absCwd = resolve(cwd);
  const found = walkUpForPersona(absCwd);
  if (forced === 'project') {
    if (!found) throw new Error(`--scope project requested but no .persona/ found walking up from ${absCwd}`);
    return { scope: 'project', projectRoot: found };
  }
  return found ? { scope: 'project', projectRoot: found } : { scope: 'global' };
}

function walkUpForPersona(start: string): string | null {
  const { root } = parse(start);
  let dir = start;
  while (true) {
    if (existsSync(join(dir, '.persona'))) return dir;
    if (dir === root) return null;
    dir = dirname(dir);
  }
}
