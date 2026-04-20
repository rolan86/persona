import { z } from 'zod';

export const LLMStatementSchema = z.object({
  statement: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence_refs: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  scope_hint: z.array(z.string()).optional(),
});

export const LLMOutputSchema = z.object({
  preferences: z.array(LLMStatementSchema),
  conventions: z.array(LLMStatementSchema),
  rationales: z.array(LLMStatementSchema),
});

export type LLMOutput = z.infer<typeof LLMOutputSchema>;
export type LLMStatement = z.infer<typeof LLMStatementSchema>;
