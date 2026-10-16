import { realpathSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Return whether a module is the directly executed script, including through symlinked paths. */
export function isDirectExecution(
  moduleUrl: string,
  executablePath = process.argv[1],
  executableNames?: readonly string[],
): boolean {
  if (!executablePath) return false;
  const executable = realpathSync(executablePath);
  if (executableNames && !executableNames.includes(basename(executable))) return false;
  return realpathSync(fileURLToPath(moduleUrl)) === executable;
}
