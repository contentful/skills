// Command-line plumbing shared by the commands: flags in, one JSON document out.
// stdout carries the JSON result an agent consumes; anything for a human goes to stderr or to a file.
import { parseArgs } from 'node:util';

/** A failure the caller can act on. `code` 2 = wrong usage or a refused action, 1 = the operation failed. */
export class CliError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}

/** Parse `--long-name` flags. Unknown flags and missing required ones are usage errors. */
export function flags(argv, options, required = []) {
  let values;
  try { ({ values } = parseArgs({ args: argv, options, allowPositionals: false, strict: true })); }
  catch (e) { throw new CliError(e.message, 2); }
  const missing = required.filter(name => values[name] === undefined);
  if (missing.length) throw new CliError(`missing ${missing.map(n => `--${n}`).join(', ')}`, 2);
  return values;
}
export const list = (value) => (value || '').split(',').map(s => s.trim()).filter(Boolean);

/** The one JSON document a command prints. */
export function emit(result) { process.stdout.write(JSON.stringify(result, null, 2) + '\n'); }
