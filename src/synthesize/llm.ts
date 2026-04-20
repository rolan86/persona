import Anthropic from '@anthropic-ai/sdk';

export interface LLMClient {
  complete(prompt: string): Promise<string>;
}

export function createAnthropicClient(opts?: { model?: string; apiKey?: string }): LLMClient {
  const client = new Anthropic({ apiKey: opts?.apiKey });
  const model = opts?.model ?? 'claude-opus-4-7';
  return {
    async complete(prompt) {
      const resp = await client.messages.create({
        model,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = resp.content.find((b) => b.type === 'text');
      if (!block || block.type !== 'text') throw new Error('No text in LLM response');
      return block.text;
    },
  };
}
