import { type, action } from '@contentful/skill-kit';
import { join } from 'node:path';
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
  '@contentful/optimization-web',
  '@contentful/optimization-react-web',
  '@contentful/optimization-node',
  '@contentful/optimization-react-native',
  '@contentful/optimization-web-preview-panel',
  '@contentful/optimization-core',
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

async function detectPackageManager(root: string): Promise<'pnpm' | 'yarn' | 'bun' | 'npm' | 'unknown'> {
  const checks: Array<[string, 'pnpm' | 'yarn' | 'bun' | 'npm']> = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
  ];
  for (const [file, pm] of checks) {
    try {
      await access(join(root, file));
      return pm;
    } catch {
      /* continue */
    }
  }
  return 'unknown';
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

    const ninetailed = findPackages(NINETAILED_PACKAGES);
    const optimization = findPackages(OPTIMIZATION_PACKAGES);
    const hasOptimizationReactWeb = optimization.some((p) => p.name === '@contentful/optimization-react-web');
    const hasOptimizationWeb = optimization.some((p) => p.name === '@contentful/optimization-web');
    const hasOptimizationNode = optimization.some((p) => p.name === '@contentful/optimization-node');
    const hasPreviewPanel = optimization.some((p) => p.name === '@contentful/optimization-web-preview-panel');

    const sdkFamily: 'mixed' | 'optimization' | 'ninetailed' | 'unknown' =
      ninetailed.length > 0 && optimization.length > 0
        ? 'mixed'
        : optimization.length > 0
          ? 'optimization'
          : ninetailed.length > 0
            ? 'ninetailed'
            : 'unknown';

    const runtimeHint: 'react-web' | 'web' | 'node' | 'hybrid' | 'unknown' =
      hasOptimizationNode && (hasOptimizationReactWeb || hasOptimizationWeb)
        ? 'hybrid'
        : hasOptimizationReactWeb
          ? 'react-web'
          : hasOptimizationWeb
            ? 'web'
            : hasOptimizationNode
              ? 'node'
              : 'unknown';

    return {
      packages: {
        ninetailed,
        optimization,
        contentful: findPackages(CONTENTFUL_PACKAGES),
        framework: findPackages(FRAMEWORK_PACKAGES),
      },
      detected: {
        sdkFamily,
        runtimeHint,
        hasPreviewPanel,
        hasOptimizationReactWeb,
        hasOptimizationWeb,
        hasOptimizationNode,
      },
      packageManager,
    };
  },
});
