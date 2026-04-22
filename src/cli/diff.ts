import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { loadProfile } from '../profile/io.js';
import { profileGeneratedPath, previousDir, type Scope } from '../paths.js';
import type { Profile } from '../profile/schema.js';

export interface DiffSection { added: string[]; removed: string[]; }
export interface DiffResult {
  preferences: DiffSection;
  conventions: DiffSection;
  rationales: DiffSection;
}

export function runDiff(scope: Scope): DiffResult {
  const current = loadProfile(profileGeneratedPath(scope));
  if (!current) throw new Error('No current profile.');
  const dir = previousDir(scope);
  if (!existsSync(dir)) return allAdded(current);
  const files = readdirSync(dir).filter(f => f.startsWith('profile.')).sort();
  if (!files.length) return allAdded(current);
  const prevFile = files[files.length - 1];
  let prev;
  try {
    prev = loadProfile(join(dir, prevFile));
  } catch (e) {
    throw new Error(`Previous profile "${prevFile}" is malformed: ${(e as Error).message}`);
  }
  if (!prev) throw new Error('Failed to load previous profile.');
  return {
    preferences: diffStatements(current.preferences, prev.preferences),
    conventions: diffStatements(current.conventions, prev.conventions),
    rationales: diffStatements(current.rationales, prev.rationales),
  };
}

function diffStatements(curr: { statement: string }[], prev: { statement: string }[]): DiffSection {
  const c = new Set(curr.map(x => x.statement));
  const p = new Set(prev.map(x => x.statement));
  return {
    added: [...c].filter(s => !p.has(s)),
    removed: [...p].filter(s => !c.has(s)),
  };
}

function allAdded(c: Profile): DiffResult {
  return {
    preferences: { added: c.preferences.map(p => p.statement), removed: [] },
    conventions: { added: c.conventions.map(p => p.statement), removed: [] },
    rationales: { added: c.rationales.map(p => p.statement), removed: [] },
  };
}
