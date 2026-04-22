import { existsSync } from 'fs';
import { profileOverridesPath, type Scope } from '../paths.js';

// v1: print the overrides path; spawning $EDITOR is deferred (plan §Task 21).
export function runEdit(scope: Scope): { path: string; exists: boolean } {
  const path = profileOverridesPath(scope);
  return { path, exists: existsSync(path) };
}
