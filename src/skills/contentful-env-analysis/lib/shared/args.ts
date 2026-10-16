// Minimal `--flag value` / `--bool` CLI parser shared by every phase script.
// `--flag value` → { flag: value }; a bare `--flag` (no following value) → { flag: true }.

export type Args = Record<string, string | boolean>;

export function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token && token.startsWith('--')) {
      const equals = token.indexOf('=');
      if (equals !== -1) {
        out[token.slice(2, equals)] = token.slice(equals + 1);
        continue;
      }
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

/**
 * The value of a flag that must carry a string, or `null` if it is absent or was given without one.
 * A value-less flag parses to boolean `true` above, and `String(true)` would hand back the literal
 * `"true"` — for the deterministic-id seed that means a parallel id namespace and duplicate entities.
 */
export function stringArg(args: Args, key: string): string | null {
  const value = args[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** Same as `stringArg`, but throws for a caller whose option is mandatory. */
export function requiredStringArg(args: Args, key: string): string {
  const value = stringArg(args, key);
  if (value === null) throw new Error(`--${key} is required and must have a value`);
  return value;
}
