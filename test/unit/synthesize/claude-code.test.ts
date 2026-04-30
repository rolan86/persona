import { describe, it, expect } from 'vitest';
import { createClaudeCodeClient } from '../../../src/synthesize/claude-code';

describe('createClaudeCodeClient', () => {
  it('returns stdout from the spawned binary', async () => {
    const client = createClaudeCodeClient({ binPath: '/bin/echo' });
    const out = await client.complete('hello');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toContain('hello');
  });

  it('throws an error mentioning the exit code on non-zero exit', async () => {
    const client = createClaudeCodeClient({ binPath: '/usr/bin/false' });
    await expect(client.complete('whatever')).rejects.toThrow(/exited with code 1/);
  });
});
