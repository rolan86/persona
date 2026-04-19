export type Window = { days: number } | { sessions: number };

export function parseWindow(input: string | undefined): Window {
  if (input === undefined) return { days: 90 };
  const m = /^(\d+)(d|s)$/.exec(input);
  if (!m) throw new Error(`Invalid --window: "${input}" (expected e.g. "90d" or "500s")`);
  const n = parseInt(m[1], 10);
  if (n === 0) throw new Error(`--window must be > 0`);
  return m[2] === 'd' ? { days: n } : { sessions: n };
}
