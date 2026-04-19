import { describe, it, expect } from 'vitest';
import { parseWindow } from '../../../src/ingest/window';

describe('parseWindow', () => {
  it('parses "90d" as 90 days', () => {
    expect(parseWindow('90d')).toEqual({ days: 90 });
  });
  it('parses "500s" as 500 sessions', () => {
    expect(parseWindow('500s')).toEqual({ sessions: 500 });
  });
  it('throws on invalid format', () => {
    expect(() => parseWindow('90')).toThrow();
    expect(() => parseWindow('abc')).toThrow();
    expect(() => parseWindow('-5d')).toThrow();
  });
  it('returns default when undefined', () => {
    expect(parseWindow(undefined)).toEqual({ days: 90 });
  });
});
