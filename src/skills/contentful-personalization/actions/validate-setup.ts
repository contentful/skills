import { type, action } from '@contentful/skill-kit';
import { ValidationResult } from '../schemas.js';
import { checkPackages } from './check-packages.js';
import { scanCredentials } from './scan-credentials.js';
import { checkApiConnectivity } from './check-api.js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }> = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    await Promise.all(
      entries.map(async (entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.git') || entry.name === 'dist') return;
          await walk(full);
          return;
        }
        if (!entry.isFile()) return;
        const ext = full.slice(full.lastIndexOf('.'));
        if (SCAN_EXTENSIONS.has(ext)) out.push(full);
      }),
    );
  }
  await walk(root);
  return out;
}

async function scanCodePatterns(projectPath: string) {
  const files = await walkFiles(projectPath);
  const flags = {
    hasOptimizationRoot: false,
    hasOptimizationProvider: false,
    hasOptimizedEntry: false,
    hasNextAppTracker: false,
    hasNextPagesTracker: false,
    hasCtflTrackingData: false,
    hasAnonymousCookieUsage: false,
  };

  await Promise.all(
    files.map(async (file) => {
      let content = '';
      try {
        content = await readFile(file, 'utf-8');
      } catch {
        return;
      }
      if (!flags.hasOptimizationRoot && /\bOptimizationRoot\b/.test(content)) flags.hasOptimizationRoot = true;
      if (!flags.hasOptimizationProvider && /\bOptimizationProvider\b/.test(content)) flags.hasOptimizationProvider = true;
      if (!flags.hasOptimizedEntry && /\bOptimizedEntry\b/.test(content)) flags.hasOptimizedEntry = true;
      if (!flags.hasNextAppTracker && /\bNextAppAutoPageTracker\b/.test(content)) flags.hasNextAppTracker = true;
      if (!flags.hasNextPagesTracker && /\bNextPagesAutoPageTracker\b/.test(content)) flags.hasNextPagesTracker = true;
      if (!flags.hasCtflTrackingData && /data-ctfl-entry-id/.test(content)) flags.hasCtflTrackingData = true;
      if (!flags.hasAnonymousCookieUsage && /ctfl-opt-aid|ANONYMOUS_ID_COOKIE/.test(content))
        flags.hasAnonymousCookieUsage = true;
    }),
  );

  return flags;
}

export const validateSetup = action({
  name: 'validate-setup',
  input: type({ projectPath: 'string' }),
  output: ValidationResult,
  run: async ({ input, signal }) => {
    const packages = await checkPackages.run({
      input: { projectPath: input.projectPath },
      signal,
    });

    const credentials = await scanCredentials.run({
      input: { projectPath: input.projectPath },
      signal,
    });

    const api = await checkApiConnectivity.run({
      input: {
        ...(credentials.personalization?.apiKey ? { apiKey: credentials.personalization.apiKey } : {}),
        ...(credentials.personalization?.clientId ? { clientId: credentials.personalization.clientId } : {}),
        personalizationEnvironment: credentials.personalization?.environment ?? 'main',
        ...(credentials.contentful?.spaceId ? { contentfulSpaceId: credentials.contentful.spaceId } : {}),
        contentfulEnvironment: credentials.contentful?.environment ?? 'master',
        experienceBaseUrl: credentials.personalization?.experienceBaseUrl ?? 'https://experience.ninetailed.co',
      },
      signal,
    });

    const codePatterns = await scanCodePatterns(input.projectPath);

    const issues: string[] = [];

    const hasAnySdk = packages.packages.ninetailed.length > 0 || packages.packages.optimization.length > 0;
    if (!hasAnySdk) issues.push('No personalization SDK packages installed');

    const hasContentful = packages.packages.contentful.some((p) => p.name === 'contentful');
    if (!hasContentful) issues.push('Contentful SDK not installed');

    const missingEnv = credentials.envVars.filter((v) => v.status === 'missing');
    if (missingEnv.length > 0) issues.push(`Missing env vars: ${missingEnv.map((v) => v.name).join(', ')}`);

    if (api.status === 'fail') issues.push('API connectivity check failed');

    if (packages.detected.sdkFamily === 'optimization') {
      if (packages.detected.runtimeHint === 'react-web' && !codePatterns.hasOptimizationRoot) {
        issues.push('Optimization React setup missing OptimizationRoot');
      }
      if (packages.detected.runtimeHint === 'react-web' && !codePatterns.hasOptimizedEntry) {
        issues.push('Optimization React setup missing OptimizedEntry usage');
      }
      if (packages.detected.runtimeHint === 'hybrid' && !codePatterns.hasAnonymousCookieUsage) {
        issues.push('Hybrid optimization setup missing ctfl-opt-aid/ANONYMOUS_ID_COOKIE usage');
      }
    }

    const overallStatus =
      issues.length === 0
        ? ('pass' as const)
        : issues.some((i) => i.includes('SDK') || i.includes('API'))
          ? ('fail' as const)
          : ('warn' as const);

    return {
      packages,
      credentials,
      api,
      codePatterns,
      overallStatus,
      summary: issues.length === 0 ? 'All checks passed' : `${issues.length} issue(s) found: ${issues.join('; ')}`,
    };
  },
});
