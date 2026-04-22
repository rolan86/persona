import { loadDossier } from '../dossier/io.js';
import { dossierPath, type Scope } from '../paths.js';
import type { Dossier } from '../dossier/types.js';

export function runDossierCmd(scope: Scope): Dossier | null {
  return loadDossier(dossierPath(scope));
}
