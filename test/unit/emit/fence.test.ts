import { describe, it, expect } from 'vitest';
import { parseFence, replaceFence } from '../../../src/emit/fence';

describe('fence', () => {
  it('detects absent fence', () => {
    expect(parseFence('# hello\n\nsome user content\n').kind).toBe('absent');
  });

  it('detects well-formed fence', () => {
    const md = 'before\n<!-- PERSONA:START v1 generated=2026-04-18T00:00:00Z -->\nbody\n<!-- PERSONA:END -->\nafter\n';
    const r = parseFence(md);
    expect(r.kind).toBe('present');
    if (r.kind === 'present') {
      expect(r.before).toBe('before\n');
      expect(r.after).toBe('\nafter\n');
      expect(r.generatedAt).toBe('2026-04-18T00:00:00Z');
    }
  });

  it('throws on malformed fence (missing END)', () => {
    const md = '<!-- PERSONA:START v1 generated=x -->\nbody\n';
    expect(() => parseFence(md)).toThrow(/malformed/i);
  });

  it('appends fence when absent', () => {
    const out = replaceFence('existing\n', 'body\n');
    expect(out).toContain('existing');
    expect(out).toContain('PERSONA:START');
    expect(out).toContain('body');
    expect(out).toContain('PERSONA:END');
  });

  it('replaces fence in place when present', () => {
    const md = 'A\n<!-- PERSONA:START v1 generated=old -->\nOLD\n<!-- PERSONA:END -->\nZ\n';
    const out = replaceFence(md, 'NEW\n');
    expect(out).toContain('A\n');
    expect(out).toContain('NEW\n');
    expect(out).toContain('\nZ\n');
    expect(out).not.toContain('OLD');
  });
});
