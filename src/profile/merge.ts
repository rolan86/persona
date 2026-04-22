import type { Profile } from './schema.js';

export function mergeProfiles(generated: Profile, overrides: Profile | null): Profile {
  if (!overrides) return generated;
  return {
    ...generated,
    render_threshold: overrides.render_threshold ?? generated.render_threshold,
    identity: { ...generated.identity, ...overrides.identity },
    preferences: mergeById(generated.preferences, overrides.preferences),
    conventions: mergeById(generated.conventions, overrides.conventions),
    rationales: mergeById(generated.rationales, overrides.rationales),
    excluded: mergeById(generated.excluded, overrides.excluded),
  };
}

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of a) map.set(x.id, x);
  for (const x of b) map.set(x.id, x);
  return [...map.values()];
}
