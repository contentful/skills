import { type, action } from '@contentful/skill-kit';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { InstallResult, type PackageInfo } from '../schemas.js';

export type SupportedPackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
type SupportedSdkChoice = 'ninetailed' | 'optimization';
type SupportedArchitecture = 'client-only' | 'hybrid-ssr' | 'server-only';
type SupportedFramework =
  | 'nextjs-app'
  | 'nextjs-pages'
  | 'nextjs-hybrid'
  | 'gatsby'
  | 'remix'
  | 'react'
  | 'react-native'
  | 'other';

const NINETAILED_EXPERIENCE_JS_PACKAGE = '@ninetailed/experience.js';
const NINETAILED_EXPERIENCE_JS_NODE_PACKAGE = '@ninetailed/experience.js-node';
const NINETAILED_EXPERIENCE_JS_PLUGIN_INSIGHTS_PACKAGE = '@ninetailed/experience.js-plugin-insights';
const NINETAILED_EXPERIENCE_JS_PLUGIN_SSR_PACKAGE = '@ninetailed/experience.js-plugin-ssr';
const NINETAILED_EXPERIENCE_JS_FRAMEWORK_PACKAGES: Partial<Record<SupportedFramework, string>> = {
  'nextjs-app': '@ninetailed/experience.js-next',
  'nextjs-pages': '@ninetailed/experience.js-next',
  'nextjs-hybrid': '@ninetailed/experience.js-next',
  gatsby: '@ninetailed/experience.js-gatsby',
  remix: '@ninetailed/experience.js-remix',
  react: '@ninetailed/experience.js-react',
};

const CONTENTFUL_OPTIMIZATION_WEB_PACKAGE = '@contentful/optimization-web';
const CONTENTFUL_OPTIMIZATION_REACT_WEB_PACKAGE = '@contentful/optimization-react-web';
const CONTENTFUL_OPTIMIZATION_NEXTJS_PACKAGE = '@contentful/optimization-nextjs';
const CONTENTFUL_OPTIMIZATION_NODE_PACKAGE = '@contentful/optimization-node';
const CONTENTFUL_OPTIMIZATION_REACT_NATIVE_PACKAGE = '@contentful/optimization-react-native';
const REACT_NATIVE_ASYNC_STORAGE_PACKAGE = '@react-native-async-storage/async-storage';
const CONTENTFUL_PACKAGE = 'contentful';

const SAFE_PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function isReactFramework(framework: SupportedFramework): boolean {
  return framework !== 'other' && framework !== 'react-native';
}

export function derivePackagesToInstall(options: {
  sdkChoice: SupportedSdkChoice;
  framework: SupportedFramework;
  architecture: SupportedArchitecture;
}): string[] {
  if (options.sdkChoice === 'ninetailed') {
    if (options.framework === 'react-native') {
      throw new Error(
        'React Native onboarding requires @contentful/optimization-react-native; the legacy web SDK installer is not compatible.',
      );
    }

    if (options.architecture === 'server-only') {
      return [NINETAILED_EXPERIENCE_JS_PACKAGE, NINETAILED_EXPERIENCE_JS_NODE_PACKAGE];
    }

    const packages = [NINETAILED_EXPERIENCE_JS_PACKAGE];
    const frameworkPackage = NINETAILED_EXPERIENCE_JS_FRAMEWORK_PACKAGES[options.framework];

    if (frameworkPackage) {
      packages.push(frameworkPackage);
    }

    if (options.architecture === 'hybrid-ssr') {
      packages.push(NINETAILED_EXPERIENCE_JS_PLUGIN_SSR_PACKAGE);
    }

    packages.push(NINETAILED_EXPERIENCE_JS_PLUGIN_INSIGHTS_PACKAGE);
    return packages;
  }

  // @contentful/optimization

  if (options.framework === 'react-native') {
    return [CONTENTFUL_OPTIMIZATION_REACT_NATIVE_PACKAGE, REACT_NATIVE_ASYNC_STORAGE_PACKAGE, CONTENTFUL_PACKAGE];
  }

  // Next.js uses the dedicated adapter for every architecture. It composes the
  // Node SDK (server) and React Web SDK (client). Application code starts from
  // the bound /app-router factory or the split /pages-router and
  // /pages-router/server factories; /client and /server are lower-level paths.
  if (
    options.framework === 'nextjs-app' ||
    options.framework === 'nextjs-pages' ||
    options.framework === 'nextjs-hybrid'
  ) {
    return [CONTENTFUL_OPTIMIZATION_NEXTJS_PACKAGE];
  }

  // Non-Next React frameworks: the React Web SDK wraps the Web SDK
  // transitively. Add the Node SDK whenever the server is involved.
  if (isReactFramework(options.framework)) {
    const packages = [CONTENTFUL_OPTIMIZATION_REACT_WEB_PACKAGE];

    if (options.architecture !== 'client-only') {
      packages.push(CONTENTFUL_OPTIMIZATION_NODE_PACKAGE);
    }

    return packages;
  }

  // Non-React ("other"): the browser uses the Web SDK, the server uses the
  // Node SDK. The Core SDK is the shared foundation and is not used directly.
  if (options.architecture === 'server-only') {
    return [CONTENTFUL_OPTIMIZATION_NODE_PACKAGE];
  }

  const packages = [CONTENTFUL_OPTIMIZATION_WEB_PACKAGE];

  if (options.architecture === 'hybrid-ssr') {
    packages.push(CONTENTFUL_OPTIMIZATION_NODE_PACKAGE);
  }

  return packages;
}

export function buildInstallCommand(
  packageManager: SupportedPackageManager,
  packages: string[],
): { cmd: string; args: string[]; command: string } {
  const packageArgs = packageManager === 'bun' ? packages : ['--', ...packages];

  const installCmd: Record<SupportedPackageManager, { cmd: string; args: string[] }> = {
    npm: { cmd: 'npm', args: ['install', ...packageArgs] },
    yarn: { cmd: 'yarn', args: ['add', ...packageArgs] },
    pnpm: { cmd: 'pnpm', args: ['add', ...packageArgs] },
    bun: { cmd: 'bun', args: ['add', ...packageArgs] },
  };

  const { cmd, args } = installCmd[packageManager];
  return { cmd, args, command: `${cmd} ${args.join(' ')}` };
}

function isSafePackageName(name: string): boolean {
  return !name.startsWith('-') && SAFE_PACKAGE_NAME.test(name);
}

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

    const unsafePackages = packages.filter((name) => !isSafePackageName(name));
    if (unsafePackages.length > 0) {
      return {
        installed: [],
        failed: unsafePackages.map((name) => ({
          name,
          error: 'Rejected package request because the name is not a safe npm package identifier',
        })),
        command: '(rejected invalid package request)',
      };
    }

    const { cmd, args, command } = buildInstallCommand(packageManager, packages);

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
