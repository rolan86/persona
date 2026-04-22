import { describe, it, expect } from 'vitest';
import { rotatePrevious } from '../../../src/profile/rotate';
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('rotatePrevious', () => {
  it('keeps at most 5 files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'persona-rot-'));
    try {
      for (let i = 1; i <= 7; i++) {
        writeFileSync(join(dir, `profile.2026040${i}-0000.yaml`), 'v');
      }
      rotatePrevious(dir);
      const files = readdirSync(dir).sort();
      expect(files.length).toBe(5);
      expect(files[0]).toBe('profile.20260403-0000.yaml');
    } finally { rmSync(dir, { recursive: true }); }
  });

  it('no-ops on missing dir', () => {
    expect(() => rotatePrevious('/nope/missing')).not.toThrow();
  });
});
