import { emitToClaudeMd } from '../emit/index.js';
import { loadProfile } from '../profile/io.js';
import { mergeProfiles } from '../profile/merge.js';
import { profileGeneratedPath, profileOverridesPath, resolveClaudeMdPath, type Scope } from '../paths.js';

export function runEmit(scope: Scope): void {
  const generated = loadProfile(profileGeneratedPath(scope));
  if (!generated) throw new Error('No generated profile found — run `persona rebuild` first.');
  const overrides = loadProfile(profileOverridesPath(scope));
  const merged = mergeProfiles(generated, overrides);
  emitToClaudeMd({ path: resolveClaudeMdPath(scope), profile: merged });
}
