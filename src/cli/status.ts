import { existsSync, statSync } from 'fs';
import { resolvePersonaDir, profileGeneratedPath, dossierPath, resolveClaudeMdPath, type Scope } from '../paths.js';

export interface StatusReport {
  personaDir: string;
  claudeMdPath: string;
  hasGenerated: boolean;
  hasDossier: boolean;
  lastRebuild: string | null;
}

export function runStatus(scope: Scope): StatusReport {
  const gen = profileGeneratedPath(scope);
  const dos = dossierPath(scope);
  return {
    personaDir: resolvePersonaDir(scope),
    claudeMdPath: resolveClaudeMdPath(scope),
    hasGenerated: existsSync(gen),
    hasDossier: existsSync(dos),
    lastRebuild: existsSync(gen) ? statSync(gen).mtime.toISOString() : null,
  };
}
