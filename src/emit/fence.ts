const START_RE = /<!--\s*PERSONA:START\s+v1\s+generated=(\S+)\s*-->/;
const END_RE = /<!--\s*PERSONA:END\s*-->/;

export type FenceParse =
  | { kind: 'absent' }
  | { kind: 'present'; before: string; body: string; after: string; generatedAt: string };

export function parseFence(md: string): FenceParse {
  const startMatch = START_RE.exec(md);
  const endMatch = END_RE.exec(md);
  if (!startMatch && !endMatch) return { kind: 'absent' };
  if (!startMatch || !endMatch) throw new Error('CLAUDE.md has a malformed PERSONA fence (only one marker present). Fix manually or delete the marker before running again.');
  if (endMatch.index < startMatch.index) throw new Error('CLAUDE.md PERSONA fence markers are in wrong order.');
  return {
    kind: 'present',
    before: md.slice(0, startMatch.index),
    body: md.slice(startMatch.index + startMatch[0].length, endMatch.index),
    after: md.slice(endMatch.index + endMatch[0].length),
    generatedAt: startMatch[1],
  };
}

export function replaceFence(md: string, body: string): string {
  const now = new Date().toISOString();
  const fence = `<!-- PERSONA:START v1 generated=${now} -->\n${body}<!-- PERSONA:END -->`;
  const parsed = parseFence(md);
  if (parsed.kind === 'absent') {
    const sep = md.length === 0 || md.endsWith('\n') ? '' : '\n';
    return `${md}${sep}\n${fence}\n`;
  }
  return `${parsed.before}${fence}${parsed.after}`;
}
