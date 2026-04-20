import type { Dossier } from '../dossier/types.js';

export function buildPrompt(dossier: Dossier): string {
  return `You are analyzing a developer's coding sessions to build a Profile of their actual preferences.

## Rules
- Only produce statements supported by evidence in the dossier below.
- Do not invent preferences. If the dossier does not support a claim, do not make it.
- confidence in [0, 1] reflects how consistent the evidence is across sources and time.
- evidence_refs must list the theme names (e.g. "communication-style") that support the statement.
- Return ONLY valid JSON matching the schema. No preamble, no code fences, no explanation.

## Schema
{ "preferences": [{ "statement": string, "confidence": number, "evidence_refs": string[], "tags": string[]?, "scope_hint": string[]? }],
  "conventions": [ ... ],
  "rationales":  [ ... ] }

- preferences: generic behavioural preferences (communication, error-handling, etc.)
- conventions: concrete rules (file naming, test placement, etc.)
- rationales: WHY statements — the reasoning behind decisions

## Dossier
${JSON.stringify(dossier, null, 2)}
`;
}
