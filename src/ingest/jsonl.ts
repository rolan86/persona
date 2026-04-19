import { existsSync, createReadStream } from 'fs';
import { createInterface } from 'readline';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { Observation, SourceReader } from './types.js';

export async function readJsonlFile(path: string): Promise<Observation[]> {
  if (!existsSync(path)) return [];
  const out: Observation[] = [];
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }) });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let parsed: any;
    try { parsed = JSON.parse(line); } catch { continue; }
    if (parsed.type !== 'user') continue;
    const text = extractText(parsed?.message?.content);
    if (!text) continue;
    out.push({
      source: 'claude-jsonl',
      sessionId: String(parsed.sessionId ?? ''),
      timestamp: String(parsed.timestamp ?? ''),
      kind: 'user-turn',
      payload: { text, cwd: parsed.cwd ?? null },
    });
  }
  return out;
}

function extractText(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const texts = content
      .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
      .map((b: any) => b.text);
    return texts.length ? texts.join('\n') : null;
  }
  return null;
}

async function listSessionFiles(): Promise<string[]> {
  const base = join(homedir(), '.claude', 'projects');
  if (!existsSync(base)) return [];
  const projects = await readdir(base, { withFileTypes: true });
  const files: string[] = [];
  for (const p of projects) {
    if (!p.isDirectory()) continue;
    const dir = join(base, p.name);
    const entries = await readdir(dir);
    for (const e of entries) if (e.endsWith('.jsonl')) files.push(join(dir, e));
  }
  return files;
}

export const jsonlSource: SourceReader = {
  name: 'claude-jsonl',
  async read({ windowDays, windowSessions }) {
    const files = (await listSessionFiles()).sort();
    const sliced = windowSessions ? files.slice(-windowSessions) : files;
    const cutoff = windowDays ? Date.now() - windowDays * 86_400_000 : 0;
    const all: Observation[] = [];
    for (const f of sliced) {
      const obs = await readJsonlFile(f);
      for (const o of obs) {
        if (windowDays && new Date(o.timestamp).getTime() < cutoff) continue;
        all.push(o);
      }
    }
    return all;
  },
};
