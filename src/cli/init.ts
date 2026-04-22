import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { stringify as yamlStringify } from 'yaml';
import { resolvePersonaDir, type Scope } from '../paths.js';

export function runInit(opts: Scope & { share: boolean }): void {
  const dir = resolvePersonaDir(opts);
  mkdirSync(dir, { recursive: true });
  const overridesPath = join(dir, 'profile.overrides.yaml');
  if (!existsSync(overridesPath)) {
    const seed = {
      version: 1,
      scope: opts.scope === 'global' ? 'global' : `project:${opts.projectRoot}`,
      identity: { name: '', email: '', primary_languages: [], primary_tools: [] },
      preferences: [], conventions: [], rationales: [], excluded: [],
    };
    writeFileSync(overridesPath, yamlStringify(seed), 'utf8');
  }
  const gi = opts.share
    ? ['dossier.json', 'previous/', 'state.json', ''].join('\n')
    : ['profile.generated.yaml', 'profile.overrides.yaml', 'dossier.json', 'previous/', 'state.json', ''].join('\n');
  writeFileSync(join(dir, '.gitignore'), gi, 'utf8');
}
