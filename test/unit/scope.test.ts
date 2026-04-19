import { describe, it, expect } from 'vitest';
import { detectScope } from '../../src/scope';
import { mkdtempSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('detectScope', () => {
  it('returns global when no .persona in cwd or parents', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-scope-'));
    try {
      expect(detectScope(tmp)).toEqual({ scope: 'global' });
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it('returns project when .persona exists in cwd', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-scope-'));
    try {
      mkdirSync(join(tmp, '.persona'));
      expect(detectScope(tmp)).toEqual({ scope: 'project', projectRoot: tmp });
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });

  it('returns project when .persona exists in parent', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-scope-'));
    try {
      mkdirSync(join(tmp, '.persona'));
      const child = join(tmp, 'deep', 'nested');
      mkdirSync(child, { recursive: true });
      expect(detectScope(child)).toEqual({ scope: 'project', projectRoot: tmp });
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });
});
