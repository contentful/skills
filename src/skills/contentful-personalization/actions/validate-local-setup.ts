import { type, action } from '@contentful/skill-kit';
import { LocalValidationResult, type Finding, type ValidationProfile } from '../schemas.js';
import { checkPackages } from './check-packages.js';
import { scanCredentials } from './scan-credentials.js';

export const validateLocalSetup = action({
  name: 'validate-local-setup',
  input: type({
    projectPath: 'string',
    'profile?':
      "'full-setup' | 'component-extension' | 'analytics-extension' | 'experiment-authoring' | 'merge-tag-extension' | 'merge-tag-code-extension' | 'diagnostic-repair'",
  }),
  output: LocalValidationResult,
  run: async ({ input, signal }) => {
    const packages = await checkPackages.run({ input, signal });
    const credentials = await scanCredentials.run({ input, signal });
    const findings: Finding[] = [];

    const hasNinetailed = packages.packages.ninetailed.length > 0;
    const hasOptimization = packages.packages.optimization.length > 0;
    const hasContentful = packages.packages.contentful.some((item) => item.name === 'contentful');
    const profile: ValidationProfile = input.profile ?? 'full-setup';
    const requiresLocalImplementation = profile !== 'experiment-authoring';
    const requiresContentfulDelivery =
      profile === 'full-setup' ||
      profile === 'component-extension' ||
      profile === 'merge-tag-extension' ||
      profile === 'diagnostic-repair';

    findings.push({
      item: 'Personalization SDK package',
      status: !requiresLocalImplementation ? 'skip' : hasNinetailed || hasOptimization ? 'pass' : 'fail',
      detail: hasOptimization
        ? '@contentful/optimization is installed'
        : hasNinetailed
          ? 'A legacy @ninetailed/experience.js integration is installed'
          : !requiresLocalImplementation
            ? 'No local SDK package is required for this authoring-only profile'
            : 'No personalization SDK package is installed',
    });
    findings.push({
      item: 'Contentful SDK package',
      status: !requiresContentfulDelivery ? 'skip' : hasContentful ? 'pass' : 'fail',
      detail: !requiresContentfulDelivery
        ? `The ${profile} profile does not require local Content Delivery SDK evidence`
        : hasContentful
          ? 'contentful is installed'
          : 'The contentful package is not installed',
    });

    const requiredEnvVars = new Set([
      ...(requiresContentfulDelivery ? ['CONTENTFUL_SPACE_ID', 'CONTENTFUL_ACCESS_TOKEN'] : []),
      ...(requiresLocalImplementation && hasOptimization ? ['OPTIMIZATION_CLIENT_ID'] : []),
      ...(requiresLocalImplementation && hasNinetailed ? ['NINETAILED_API_KEY'] : []),
    ]);
    const missing = credentials.envVars.filter(
      (variable) => requiredEnvVars.has(variable.name) && variable.status !== 'set',
    );
    findings.push({
      item: 'Required environment variables',
      status: requiredEnvVars.size === 0 ? 'skip' : missing.length === 0 ? 'pass' : 'fail',
      detail:
        requiredEnvVars.size === 0
          ? `No local environment variables are required for the ${profile} profile`
          : missing.length === 0
            ? 'All environment variables required by the installed SDK are available'
            : `Missing or empty: ${missing.map((variable) => variable.name).join(', ')}`,
    });

    const unsafeManagementToken = credentials.envVars.find(
      (variable) => variable.name === 'CONTENTFUL_MANAGEMENT_TOKEN' && variable.warning,
    );
    if (unsafeManagementToken?.warning) {
      findings.push({
        item: 'Management token exposure',
        status: 'fail',
        detail: unsafeManagementToken.warning,
      });
    }

    if (profile === 'analytics-extension') {
      findings.push({
        item: 'Optional validation credentials',
        status: credentials.contentful?.managementToken ? 'pass' : 'skip',
        detail: credentials.contentful?.managementToken
          ? 'A server-only CMA credential is available for smoother aggregate Live Events checks'
          : 'A server-only CMA credential is optional and makes aggregate Live Events checks smoother',
      });
    } else if (profile !== 'merge-tag-code-extension') {
      const optionalTokens = [
        credentials.contentful?.previewToken ? 'CPA' : undefined,
        credentials.contentful?.managementToken ? 'CMA' : undefined,
      ].filter(Boolean);
      findings.push({
        item: 'Optional validation credentials',
        status: optionalTokens.length > 0 ? 'pass' : 'skip',
        detail:
          optionalTokens.length > 0
            ? `${optionalTokens.join(' and ')} credentials are available for smoother content and Live Events validation`
            : 'A Preview API token and server-only Management token are optional, but make draft-content and Live Events validation smoother',
      });
    }

    const status = findings.some((finding) => finding.status === 'fail') ? ('fail' as const) : ('pass' as const);
    return {
      packages,
      credentials,
      status,
      findings,
      summary:
        status === 'pass'
          ? 'Local packages and required environment variables are ready'
          : 'Local setup has blocking package, credential, or credential-exposure issues',
    };
  },
});
