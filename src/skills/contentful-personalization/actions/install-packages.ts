import { type, action } from '@contentful/skill-kit';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { InstallResult, type PackageInfo } from '../schemas.js';

function exec(
  cmd: string,
  args: string[],
  opts: { cwd: string; signal: AbortSignal },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = execFile(cmd, args, { cwd: opts.cwd, timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
    opts.signal.addEventListener('abort', () => proc.kill());
  });
}

export const installPackages = action({
  name: 'install-packages',
  input: type({
    packages: 'string[]',
    projectPath: 'string',
    packageManager: "'npm' | 'yarn' | 'pnpm' | 'bun'",
  }),
  output: InstallResult,
  run: async ({ input, signal }) => {
    const { packages, projectPath, packageManager } = input;

    if (packages.length === 0) {
      return { installed: [], failed: [], command: '(no packages requested)' };
    }

    const installCmd: Record<string, { cmd: string; args: string[] }> = {
      npm: { cmd: 'npm', args: ['install', ...packages] },
      yarn: { cmd: 'yarn', args: ['add', ...packages] },
      pnpm: { cmd: 'pnpm', args: ['add', ...packages] },
      bun: { cmd: 'bun', args: ['add', ...packages] },
    };

    const { cmd, args } = installCmd[packageManager];
    const command = `${cmd} ${args.join(' ')}`;

    try {
      await exec(cmd, args, { cwd: projectPath, signal });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        installed: [],
        failed: packages.map((name) => ({ name, error: message })),
        command,
      };
    }

    const installed: PackageInfo[] = [];
    const failed: Array<{ name: string; error: string }> = [];

    try {
      const pkgContent = await readFile(join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgContent);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const name of packages) {
        if (allDeps[name]) {
          installed.push({ name, version: allDeps[name] });
        } else {
          failed.push({
            name,
            error: 'Not found in package.json after install',
          });
        }
      }
    } catch {
      for (const name of packages) {
        installed.push({ name, version: 'unknown' });
      }
    }

    return { installed, failed, command };
  },
});
