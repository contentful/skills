import { z, action } from '@contentful/skill-kit';
import { join, relative } from 'node:path';
import { readdir } from 'node:fs/promises';
import {
  ScanResult,
  type Finding,
  type CheckStatus,
  type EnvCheckResult,
  type PackageCheckResult,
  type ProviderCheckResult,
  type MiddlewareCheckResult,
  type ComponentCheckResult,
  type AnalyticsCheckResult,
} from '../schemas.js';
export type { ScanResult } from '../schemas.js';
import { walkSourceFiles, grepFiles, readFileSafe, findFiles } from './fs-utils.js';

// --- Env var scanning ---

const KNOWN_ENV_VARS: Array<{ name: string; pattern: RegExp; required: boolean }> = [
  { name: 'NINETAILED_API_KEY', pattern: /^(NEXT_PUBLIC_)?NINETAILED_API_KEY\s*=\s*(.+)/m, required: true },
  {
    name: 'NINETAILED_ENVIRONMENT',
    pattern: /^(NEXT_PUBLIC_)?NINETAILED_ENVIRONMENT\s*=\s*(.+)/m,
    required: false,
  },
  { name: 'CONTENTFUL_SPACE_ID', pattern: /^(NEXT_PUBLIC_)?CONTENTFUL_SPACE_ID\s*=\s*(.+)/m, required: true },
  {
    name: 'CONTENTFUL_ACCESS_TOKEN',
    pattern: /^(NEXT_PUBLIC_)?CONTENTFUL_ACCESS_TOKEN\s*=\s*(.+)/m,
    required: true,
  },
];

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 8) + '****';
}

async function scanEnv(root: string): Promise<EnvCheckResult> {
  const findings: Finding[] = [];
  let apiKey: string | undefined;
  let environment: string | undefined;

  let entries: string[];
  try {
    entries = await readdir(root).then((e) => e.filter((f) => f.startsWith('.env')));
  } catch {
    entries = [];
  }

  if (entries.length === 0) {
    return {
      status: 'fail',
      findings: [{ item: 'Environment files', status: 'fail', detail: 'No .env files found' }],
    };
  }

  const envContents: string[] = [];
  for (const entry of entries) {
    const content = await readFileSafe(join(root, entry));
    if (content) envContents.push(content);
  }

  const combined = envContents.join('\n');

  for (const { name, pattern, required } of KNOWN_ENV_VARS) {
    const match = combined.match(pattern);
    if (match) {
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!value) {
        findings.push({ item: name, status: 'warn', detail: 'Present but empty' });
      } else {
        findings.push({ item: name, status: 'pass', detail: `Present (${maskKey(value)})` });
        if (name === 'NINETAILED_API_KEY') apiKey = value;
        if (name === 'NINETAILED_ENVIRONMENT') environment = value;
      }
    } else if (required) {
      findings.push({ item: name, status: 'fail', detail: 'Not found in any .env file' });
    } else {
      findings.push({ item: name, status: 'warn', detail: 'Not set (defaults will be used)' });
    }
  }

  const status = deriveStatus(findings);
  return { status, findings, apiKey, environment };
}

// --- Package scanning ---

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

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
];

async function scanPackages(root: string): Promise<PackageCheckResult> {
  const findings: Finding[] = [];
  const installedPackages: string[] = [];
  let mainVersion: string | undefined;

  const pkgContent = await readFileSafe(join(root, 'package.json'));
  if (!pkgContent) {
    return {
      status: 'fail',
      findings: [{ item: 'package.json', status: 'fail', detail: 'Not found' }],
      installedPackages: [],
    };
  }

  let pkg: PackageJson;
  try {
    pkg = JSON.parse(pkgContent);
  } catch {
    return {
      status: 'fail',
      findings: [{ item: 'package.json', status: 'fail', detail: 'Invalid JSON' }],
      installedPackages: [],
    };
  }

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const name of NINETAILED_PACKAGES) {
    if (allDeps[name]) {
      installedPackages.push(name);
      const version = allDeps[name];
      findings.push({ item: name, status: 'pass', detail: version });
      if (name === '@ninetailed/experience.js') {
        mainVersion = version;
      }
    }
  }

  if (installedPackages.length === 0) {
    findings.push({
      item: 'Ninetailed SDK',
      status: 'fail',
      detail: 'No @ninetailed packages found in dependencies',
    });
  }

  if (!allDeps['@ninetailed/experience.js']) {
    findings.push({
      item: '@ninetailed/experience.js',
      status: 'fail',
      detail: 'Core SDK not installed',
    });
  }

  const status = deriveStatus(findings);
  return { status, findings, mainVersion, installedPackages };
}

// --- Provider scanning (fast grep) ---

const PROVIDER_PATTERNS = [/NinetailedProvider/, /ninetailedProvider/, /@ninetailed\/experience\.js/];

const ANALYTICS_PLUGIN_PATTERN = /NinetailedInsightsPlugin|plugin-insights/;

async function scanProvider(root: string, sourceFiles: string[]): Promise<ProviderCheckResult> {
  const findings: Finding[] = [];
  let location: string | undefined;
  let hasAnalyticsPlugin = false;

  for (const pattern of PROVIDER_PATTERNS) {
    const matches = await grepFiles(sourceFiles, pattern, root);
    if (matches.length > 0) {
      location = matches[0].file;
      findings.push({
        item: 'NinetailedProvider',
        status: 'pass',
        detail: `Found in ${matches[0].file}:${matches[0].line}`,
      });
      break;
    }
  }

  if (!location) {
    findings.push({ item: 'NinetailedProvider', status: 'not_found', detail: 'Not found by automated scan' });
  }

  const analyticsMatches = await grepFiles(sourceFiles, ANALYTICS_PLUGIN_PATTERN, root);
  hasAnalyticsPlugin = analyticsMatches.length > 0;
  if (hasAnalyticsPlugin) {
    findings.push({
      item: 'Analytics plugin',
      status: 'pass',
      detail: `Found in ${analyticsMatches[0].file}:${analyticsMatches[0].line}`,
    });
  }

  const status = location ? deriveStatus(findings) : 'not_found';
  return { status, findings, location, hasAnalyticsPlugin };
}

// --- Middleware scanning (fast grep) ---

async function scanMiddleware(root: string, framework: string): Promise<MiddlewareCheckResult> {
  const findings: Finding[] = [];

  if (!framework.startsWith('nextjs')) {
    return {
      status: 'skip',
      findings: [{ item: 'Middleware', status: 'skip', detail: `Not applicable for ${framework}` }],
      matcherPatterns: [],
    };
  }

  const middlewareFiles = await findFiles(root, /^middleware\.(ts|js|mjs)$/);
  if (middlewareFiles.length === 0) {
    findings.push({ item: 'middleware.ts', status: 'not_found', detail: 'Not found' });
    return { status: 'not_found', findings, matcherPatterns: [] };
  }

  const middlewarePath = relative(root, middlewareFiles[0]);
  findings.push({ item: 'middleware file', status: 'pass', detail: middlewarePath });

  const content = await readFileSafe(middlewareFiles[0]);
  const matcherPatterns: string[] = [];

  if (content) {
    const matcherRegex = /matcher\s*[=:]\s*(\[[\s\S]*?\]|['"][^'"]+['"])/;
    const match = content.match(matcherRegex);
    if (match) {
      matcherPatterns.push(match[1]);
      findings.push({ item: 'Matcher config', status: 'pass', detail: `Found: ${match[1].slice(0, 80)}` });
    }

    if (/ninetailed|ntaid/i.test(content)) {
      findings.push({ item: 'Ninetailed integration', status: 'pass', detail: 'References found in middleware' });
    } else {
      findings.push({
        item: 'Ninetailed integration',
        status: 'warn',
        detail: 'No Ninetailed references in middleware',
      });
    }
  }

  const status = deriveStatus(findings);
  return { status, findings, path: middlewarePath, matcherPatterns };
}

// --- Component scanning (fast grep) ---

const COMPONENT_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Experience component', pattern: /<Experience[\s/>]|from\s+['"].*experience/i },
  { name: 'Personalize component', pattern: /<Personalize[\s/>]|from\s+['"].*personalize/i },
  { name: 'ExperienceMapper', pattern: /ExperienceMapper/ },
  { name: 'BlockRenderer', pattern: /BlockRenderer/ },
  { name: 'ContentTypeMap', pattern: /ContentTypeMap|componentMap/i },
];

async function scanComponents(root: string, sourceFiles: string[]): Promise<ComponentCheckResult> {
  const findings: Finding[] = [];
  const files: string[] = [];
  let hasComponentMapper = false;

  for (const { name, pattern } of COMPONENT_PATTERNS) {
    const matches = await grepFiles(sourceFiles, pattern, root);
    if (matches.length > 0) {
      const uniqueFiles = [...new Set(matches.map((m) => m.file))];
      files.push(...uniqueFiles);
      findings.push({
        item: name,
        status: 'pass',
        detail: `Found in ${uniqueFiles.length} file(s): ${uniqueFiles.slice(0, 3).join(', ')}`,
      });
      if (name === 'ContentTypeMap' || name === 'ExperienceMapper') {
        hasComponentMapper = true;
      }
    } else {
      findings.push({ item: name, status: 'not_found', detail: 'Not found by automated scan' });
    }
  }

  const uniqueFiles = [...new Set(files)];
  const hasAnyComponent = findings.some((f) => f.status === 'pass');
  const status: CheckStatus = hasAnyComponent ? deriveStatus(findings) : 'not_found';
  return { status, findings, files: uniqueFiles, hasComponentMapper };
}

// --- Analytics scanning (fast grep) ---

const ANALYTICS_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Insights plugin', pattern: /NinetailedInsightsPlugin|plugin-insights/ },
  { name: 'GTM plugin', pattern: /NinetailedGoogleTagmanagerPlugin|plugin-google-tagmanager/ },
  { name: 'Segment plugin', pattern: /NinetailedSegmentPlugin|plugin-segment/ },
  { name: 'Contentsquare plugin', pattern: /NinetailedContentsquarePlugin|plugin-contentsquare/ },
  { name: 'Track calls', pattern: /\.track\(|\.page\(|\.identify\(/ },
];

async function scanAnalytics(root: string, sourceFiles: string[]): Promise<AnalyticsCheckResult> {
  const findings: Finding[] = [];
  const eventsFound: string[] = [];
  let pluginConfigured = false;

  for (const { name, pattern } of ANALYTICS_PATTERNS) {
    const matches = await grepFiles(sourceFiles, pattern, root);
    if (matches.length > 0) {
      findings.push({
        item: name,
        status: 'pass',
        detail: `Found in ${matches[0].file}:${matches[0].line}`,
      });
      eventsFound.push(name);
      if (name.includes('plugin')) pluginConfigured = true;
    }
  }

  if (findings.length === 0) {
    findings.push({ item: 'Analytics', status: 'not_found', detail: 'No analytics configuration found' });
  }

  const status: CheckStatus = pluginConfigured ? 'pass' : findings.some((f) => f.status === 'pass') ? 'warn' : 'not_found';
  return { status, findings, pluginConfigured, eventsFound };
}

// --- Helpers ---

function deriveStatus(findings: Finding[]): CheckStatus {
  if (findings.some((f) => f.status === 'fail')) return 'fail';
  if (findings.some((f) => f.status === 'not_found')) return 'warn';
  if (findings.some((f) => f.status === 'warn')) return 'warn';
  if (findings.every((f) => f.status === 'skip')) return 'skip';
  return 'pass';
}

// --- Main action ---

export const scanProject = action({
  name: 'scan-project',
  input: z.object({
    projectPath: z.string(),
    framework: z.string(),
  }),
  output: ScanResult,
  run: async ({ input }) => {
    const root = input.projectPath;
    const sourceFiles = await walkSourceFiles(root);

    const [env, packages, provider, middleware, components, analytics] = await Promise.all([
      scanEnv(root),
      scanPackages(root),
      scanProvider(root, sourceFiles),
      scanMiddleware(root, input.framework),
      scanComponents(root, sourceFiles),
      scanAnalytics(root, sourceFiles),
    ]);

    return { env, packages, provider, middleware, components, analytics };
  },
});
