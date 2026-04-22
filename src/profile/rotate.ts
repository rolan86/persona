import { existsSync, mkdirSync, readdirSync, unlinkSync, copyFileSync } from 'fs';
import { join } from 'path';

const KEEP = 5;

export function rotatePrevious(previousDir: string): void {
  if (!existsSync(previousDir)) return;
  const files = readdirSync(previousDir).filter((f) => f.startsWith('profile.') && f.endsWith('.yaml')).sort();
  const toDelete = files.slice(0, Math.max(0, files.length - KEEP));
  for (const f of toDelete) unlinkSync(join(previousDir, f));
}

export function snapshotProfile(sourcePath: string, previousDir: string): string {
  mkdirSync(previousDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12).replace(/(\d{8})(\d{4})/, '$1-$2');
  const dest = join(previousDir, `profile.${ts}.yaml`);
  copyFileSync(sourcePath, dest);
  rotatePrevious(previousDir);
  return dest;
}
