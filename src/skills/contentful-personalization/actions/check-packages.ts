import { type, action } from '@contentful/skill-kit';
import { dirname, join, resolve } from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { PackagesResult, type PackageInfo } from '../schemas.js';

const NINETAILED_PACKAGES = [
  '@ninetailed/experience.js',
  '@ninetailed/experience.js-next',
  '@ninetailed/experience.js-react',
  '@ninetailed/experience.js-gatsby',
  '@ninetailed/experience.js-remix',
  '@ninetailed/experience.js-plugin-insights',
  '@ninetailed/experience.js-plugin-preview',
  '@ninetailed/experience.js-plugin-google-tagmanager',
  '@ninetailed/experience.js-plugin-segment',
  '@ninetailed/experience.js-plugin-contentsquare',
  '@ninetailed/experience.js-shared',
  '@ninetailed/experience.js-plugin-ssr',
  '@ninetailed/experience.js-plugin-privacy',
  '@ninetailed/experience.js-node',
];

const OPTIMIZATION_PACKAGES = [
  '@contentful/optimization-core',
  '@contentful/optimization-web',
  '@contentful/optimization-react-web',
  '@contentful/optimization-nextjs',
  '@contentful/optimization-node',
  '@contentful/optimization-react-native',
  '@contentful/optimization-web-preview-panel',
  '@contentful/optimization-api-client',
  '@contentful/optimization-api-schemas',
];

const CONTENTFUL_PACKAGES = [
  'contentful',
  '@contentful/rich-text-react-renderer',
  '@contentful/rich-text-types',
  'contentful-management',
];

const FRAMEWORK_PACKAGES = ['next', 'gatsby', 'remix', '@remix-run/react', 'react', 'react-dom'];

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

type PackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm' | 'unknown';

function packageManagerFromField(value: unknown): Exclude<PackageManager, 'unknown'> | undefined {
  if (typeof value !== 'string') return undefined;
  const name = value.split('@')[0];
  return name === 'pnpm' || name === 'yarn' || name === 'bun' || name === 'npm' ? name : undefined;
}

export async function detectPackageManager(root: string): Promise<PackageManager> {
  const checks: Array<[string, 'pnpm' | 'yarn' | 'bun' | 'npm']> = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['pnpm-workspace.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
  ];

  let current = resolve(root);
  while (true) {
    const packageJson = await readFileSafe(join(current, 'package.json'));
    if (packageJson) {
      try {
        const declared = packageManagerFromField(JSON.parse(packageJson).packageManager);
        if (declared) return declared;
      } catch {
        /* invalid JSON; lockfile detection can still succeed */
      }
    }

    for (const [file, pm] of checks) {
      try {
        await access(join(current, file));
        return pm;
      } catch {
        /* continue */
      }
    }

    try {
      await access(join(current, '.git'));
      return 'unknown';
    } catch {
      /* continue to the parent */
    }

    const parent = dirname(current);
    if (parent === current) return 'unknown';
    current = parent;
  }
}

export const checkPackages = action({
  name: 'check-packages',
  input: type({ projectPath: 'string' }),
  output: PackagesResult,
  run: async ({ input }) => {
    const root = input.projectPath;

    const pkgContent = await readFileSafe(join(root, 'package.json'));
    const allDeps: Record<string, string> = {};
    if (pkgContent) {
      try {
        const pkg = JSON.parse(pkgContent);
        Object.assign(allDeps, pkg.dependencies, pkg.devDependencies);
      } catch {
        /* invalid JSON */
      }
    }

    const findPackages = (names: string[]): PackageInfo[] =>
      names.filter((name) => allDeps[name]).map((name) => ({ name, version: allDeps[name] }));

    const packageManager = await detectPackageManager(root);

    return {
      packages: {
        ninetailed: findPackages(NINETAILED_PACKAGES),
        optimization: findPackages(OPTIMIZATION_PACKAGES),
        contentful: findPackages(CONTENTFUL_PACKAGES),
        framework: findPackages(FRAMEWORK_PACKAGES),
      },
      packageManager,
    };
  },
});
