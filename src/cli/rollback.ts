import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { loadProfile } from '../profile/io.js';
import { snapshotProfile } from '../profile/rotate.js';
import { profileGeneratedPath, previousDir, type Scope } from '../paths.js';

export function runRollback(scope: Scope, to?: string): string {
  const dir = previousDir(scope);
  if (!existsSync(dir)) throw new Error('No previous profiles.');
  const files = readdirSync(dir).filter(f => f.startsWith('profile.')).sort();
  if (!files.length) throw new Error('No previous profiles.');

  let target: string;
  if (to) {
    const matches = files.filter(f => f.includes(to));
    if (matches.length === 0) throw new Error(`No previous profile matching "${to}"`);
    if (matches.length > 1) throw new Error(`Ambiguous --to "${to}" matches: ${matches.join(', ')}`);
    target = matches[0];
  } else {
    target = files[files.length - 1];
  }

  const src = join(dir, target);
  try {
    const validated = loadProfile(src);
    if (!validated) throw new Error(`Previous profile missing: ${target}`);
  } catch (e) {
    throw new Error(`Previous profile "${target}" is unreadable: ${(e as Error).message}`);
  }

  // Read src bytes before snapshotting to avoid clobbering when timestamps collide.
  const srcBytes = readFileSync(src);
  const dest = profileGeneratedPath(scope);
  if (existsSync(dest)) snapshotProfile(dest, dir);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, srcBytes);
  return target;
}
