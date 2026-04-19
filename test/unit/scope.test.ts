import { describe, it, expect } from 'vitest';
import { detectScope } from '../../src/scope';
import { mkdtempSync, mkdirSync, rmSync, realpathSync } from 'fs';
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

  it('handles relative paths by resolving to absolute', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'persona-scope-'));
    try {
      mkdirSync(join(tmp, '.persona'));
      const originalCwd = process.cwd();
      process.chdir(tmp);
      try {
        const result = detectScope('.');
        const expectedProjectRoot = realpathSync(tmp);
        expect(result).toEqual({ scope: 'project', projectRoot: expectedProjectRoot });
      } finally {
        process.chdir(originalCwd);
      }
    } finally {
      rmSync(tmp, { recursive: true });
    }
  });
});
