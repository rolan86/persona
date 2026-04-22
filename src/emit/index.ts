import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { replaceFence } from './fence.js';
import { renderProfile } from './render.js';
import type { Profile } from '../profile/schema.js';

export { parseFence, replaceFence } from './fence.js';
export { renderProfile } from './render.js';

export function emitToClaudeMd(opts: { path: string; profile: Profile }): void {
  const existing = existsSync(opts.path) ? readFileSync(opts.path, 'utf8') : '';
  const body = renderProfile(opts.profile);
  const next = replaceFence(existing, body);
  mkdirSync(dirname(opts.path), { recursive: true });
  writeFileSync(opts.path, next, 'utf8');
}
