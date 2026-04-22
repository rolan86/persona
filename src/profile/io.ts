import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ProfileSchema, type Profile } from './schema.js';

export function saveProfile(path: string, profile: Profile): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, yamlStringify(profile), 'utf8');
}

export function loadProfile(path: string): Profile | null {
  if (!existsSync(path)) return null;
  let raw: unknown;
  try {
    raw = yamlParse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`Malformed YAML at ${path}: ${(e as Error).message}`);
  }
  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
    throw new Error(`Invalid profile at ${path}: ${issues}`);
  }
  return parsed.data;
}
