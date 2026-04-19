import { z } from 'zod';

export const EvidenceSchema = z.object({
  source: z.enum(['claude-jsonl', 'git-log', 'helix']),
  count: z.number().int().nonnegative(),
  first: z.string().optional(),
  last: z.string().optional(),
  examples: z.array(z.string()).optional(),
});

export const StatementSchema = z.object({
  id: z.string(),
  statement: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.array(EvidenceSchema),
  tags: z.array(z.string()).optional(),
  scope_hint: z.array(z.string()).optional(),
});

export const ExcludedStatementSchema = StatementSchema.extend({
  reason: z.string(),
});

export const IdentitySchema = z.object({
  name: z.string(),
  email: z.string(),
  primary_languages: z.array(z.string()),
  primary_tools: z.array(z.string()),
});

export const ProfileSchema = z.object({
  version: z.literal(1),
  generated_at: z.string().optional(),
  scope: z.union([z.literal('global'), z.string().startsWith('project:')]),
  render_threshold: z.number().min(0).max(1).optional(),
  identity: IdentitySchema,
  preferences: z.array(StatementSchema),
  conventions: z.array(StatementSchema),
  rationales: z.array(StatementSchema),
  excluded: z.array(ExcludedStatementSchema),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Statement = z.infer<typeof StatementSchema>;
export type ExcludedStatement = z.infer<typeof ExcludedStatementSchema>;
export type Identity = z.infer<typeof IdentitySchema>;
