import { homedir } from 'os';
import { join } from 'path';

export type Scope =
  | { scope: 'global' }
  | { scope: 'project'; projectRoot: string };

export function resolvePersonaDir(s: Scope): string {
  return s.scope === 'global' ? join(homedir(), '.persona') : join(s.projectRoot, '.persona');
}

export function resolveClaudeMdPath(s: Scope): string {
  return s.scope === 'global'
    ? join(homedir(), '.claude', 'CLAUDE.md')
    : join(s.projectRoot, 'CLAUDE.md');
}

export function profileGeneratedPath(s: Scope): string {
  return join(resolvePersonaDir(s), 'profile.generated.yaml');
}

export function profileOverridesPath(s: Scope): string {
  return join(resolvePersonaDir(s), 'profile.overrides.yaml');
}

export function dossierPath(s: Scope): string {
  return join(resolvePersonaDir(s), 'dossier.json');
}

export function previousDir(s: Scope): string {
  return join(resolvePersonaDir(s), 'previous');
}

export function statePath(s: Scope): string {
  return join(resolvePersonaDir(s), 'state.json');
}
