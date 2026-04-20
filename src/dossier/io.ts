import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { Dossier } from './types.js';

export function saveDossier(path: string, d: Dossier): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(d, null, 2), 'utf8');
}

export function loadDossier(path: string): Dossier | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as Dossier;
}
