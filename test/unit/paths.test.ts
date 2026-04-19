import { describe, it, expect } from 'vitest';
import { resolvePersonaDir, resolveClaudeMdPath } from '../../src/paths';
import { homedir } from 'os';
import { join } from 'path';

describe('paths', () => {
  it('resolves global persona dir to ~/.persona', () => {
    expect(resolvePersonaDir({ scope: 'global' })).toBe(join(homedir(), '.persona'));
  });

  it('resolves project persona dir to <project>/.persona', () => {
    expect(resolvePersonaDir({ scope: 'project', projectRoot: '/tmp/myproj' }))
      .toBe('/tmp/myproj/.persona');
  });

  it('resolves global claude.md to ~/.claude/CLAUDE.md', () => {
    expect(resolveClaudeMdPath({ scope: 'global' }))
      .toBe(join(homedir(), '.claude', 'CLAUDE.md'));
  });

  it('resolves project claude.md to <project>/CLAUDE.md', () => {
    expect(resolveClaudeMdPath({ scope: 'project', projectRoot: '/tmp/myproj' }))
      .toBe('/tmp/myproj/CLAUDE.md');
  });
});
