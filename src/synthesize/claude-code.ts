// Uses local 'claude' CLI as the LLM transport — no ANTHROPIC_API_KEY needed.
import { spawn } from 'child_process';
import type { LLMClient } from './llm.js';

export function createClaudeCodeClient(opts?: { binPath?: string; timeoutMs?: number }): LLMClient {
  const binPath = opts?.binPath ?? 'claude';
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  return {
    complete(prompt) {
      return new Promise<string>((resolve, reject) => {
        const child = spawn(binPath, ['-p', prompt, '--output-format', 'text'], { stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        let settled = false;
        const finish = (fn: () => void) => { if (settled) return; settled = true; clearTimeout(timer); fn(); };
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          finish(() => reject(new Error(`claude CLI timed out after ${timeoutMs}ms`)));
        }, timeoutMs);
        child.stdout.on('data', (b) => { stdout += b.toString(); });
        child.stderr.on('data', (b) => { stderr += b.toString(); });
        child.on('error', (err) => finish(() => reject(new Error(`failed to spawn ${binPath}: ${err.message}`))));
        child.on('close', (code) => {
          if (code === 0) finish(() => resolve(stdout));
          else finish(() => reject(new Error(`claude CLI exited with code ${code}: ${stderr.trim()}`)));
        });
      });
    },
  };
}
