import { type, action } from '@contentful/skill-kit';
import { ValidationResult } from '../schemas.js';
import { checkPackages } from './check-packages.js';
import { scanCredentials } from './scan-credentials.js';
import { checkApiConnectivity } from './check-api.js';

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
        ninetailedEnvironment: credentials.personalization?.environment ?? 'main',
        ...(credentials.contentful?.spaceId ? { contentfulSpaceId: credentials.contentful.spaceId } : {}),
        contentfulEnvironment: credentials.contentful?.environment ?? 'master',
      },
      signal,
    });

    const issues: string[] = [];

    const hasAnySdk = packages.packages.ninetailed.length > 0 || packages.packages.optimization.length > 0;
    if (!hasAnySdk) issues.push('No personalization SDK packages installed');

    const hasContentful = packages.packages.contentful.some((p) => p.name === 'contentful');
    if (!hasContentful) issues.push('Contentful SDK not installed');

    const missingEnv = credentials.envVars.filter((v) => v.status === 'missing');
    if (missingEnv.length > 0) issues.push(`Missing env vars: ${missingEnv.map((v) => v.name).join(', ')}`);

    if (api.status === 'fail') issues.push('API connectivity check failed');

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
      overallStatus,
      summary: issues.length === 0 ? 'All checks passed' : `${issues.length} issue(s) found: ${issues.join('; ')}`,
    };
  },
});
