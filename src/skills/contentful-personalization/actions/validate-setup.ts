import { type, action } from '@contentful/skill-kit';
import { ValidationResult } from '../schemas.js';
import { checkApiConnectivity } from './check-api.js';
import { validateLocalSetup } from './validate-local-setup.js';

export const validateSetup = action({
  name: 'validate-setup',
  input: type({ projectPath: 'string' }),
  output: ValidationResult,
  run: async ({ input, signal }) => {
    const local = await validateLocalSetup.run({ input, signal });
    const { packages, credentials } = local;

    const api = await checkApiConnectivity.run({
      input: {
        ...(credentials.personalization?.apiKey ? { apiKey: credentials.personalization.apiKey } : {}),
        ninetailedEnvironment: credentials.personalization?.environment ?? 'main',
        ...(credentials.optimization?.clientId ? { optimizationClientId: credentials.optimization.clientId } : {}),
        optimizationEnvironment: credentials.optimization?.environment ?? 'main',
      },
      signal,
    });

    const issues = [
      ...(local.status === 'fail' ? [local.summary] : []),
      ...(api.status === 'fail' ? ['Experience API credential/destination connectivity check failed'] : []),
    ];
    const overallStatus = issues.length === 0 ? ('pass' as const) : ('fail' as const);

    return {
      packages,
      credentials,
      api,
      overallStatus,
      summary:
        issues.length === 0
          ? 'Local setup and Experience API credential/destination connectivity checks passed'
          : `${issues.length} issue(s) found: ${issues.join('; ')}`,
    };
  },
});
