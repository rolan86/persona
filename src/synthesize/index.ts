import { buildPrompt } from './prompts.js';
import { LLMOutputSchema, type LLMStatement } from './schema.js';
import type { LLMClient } from './llm.js';
import type { Dossier, DossierGroup } from '../dossier/types.js';
import type { Profile, Statement, ExcludedStatement, Identity } from '../profile/schema.js';

export { createAnthropicClient } from './llm.js';
export type { LLMClient } from './llm.js';

const DEFAULT_RENDER_THRESHOLD = 0.5;

export async function synthesize(opts: {
  dossier: Dossier;
  client: LLMClient;
  identity: Identity;
}): Promise<Profile> {
  const raw = await opts.client.complete(buildPrompt(opts.dossier));
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error(`LLM output is not valid JSON: ${raw.slice(0, 200)}`); }
  const result = LLMOutputSchema.safeParse(parsed);
  if (!result.success) throw new Error(`LLM output fails schema: ${result.error.message}`);

  const scope: Profile['scope'] =
    opts.dossier.scope === 'global' ? 'global' : `project:${opts.dossier.scope.project}`;
  const groupByTheme = new Map(opts.dossier.groups.map((g) => [g.theme, g]));
  const profile: Profile = {
    version: 1,
    generated_at: new Date().toISOString(),
    scope,
    identity: opts.identity,
    preferences: [],
    conventions: [],
    rationales: [],
    excluded: [],
  };
  assignStatements(result.data.preferences, 'pref', profile.preferences, profile.excluded, groupByTheme);
  assignStatements(result.data.conventions, 'conv', profile.conventions, profile.excluded, groupByTheme);
  assignStatements(result.data.rationales, 'rat', profile.rationales, profile.excluded, groupByTheme);
  return profile;
}

function assignStatements(
  raw: LLMStatement[],
  prefix: string,
  active: Statement[],
  excluded: ExcludedStatement[],
  groupByTheme: Map<string, DossierGroup>,
): void {
  raw.forEach((s, i) => {
    const id = `${prefix}_${String(i + 1).padStart(3, '0')}`;
    const evidence = s.evidence_refs.flatMap((ref) => groupByTheme.get(ref)?.evidence ?? []);
    const base: Statement = { id, statement: s.statement, confidence: s.confidence, evidence, tags: s.tags ?? [], scope_hint: s.scope_hint };
    if (s.confidence < DEFAULT_RENDER_THRESHOLD) excluded.push({ ...base, reason: `Below render threshold (${DEFAULT_RENDER_THRESHOLD}).` });
    else active.push(base);
  });
}
