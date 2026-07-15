type SdkChoice = 'optimization' | 'ninetailed' | 'mixed' | 'unknown';

export function implementationGuidance(options: { sdk: SdkChoice; workflowOwnsSetup?: boolean }): string {
  const guidance = [
    'Treat the bundled Reference Material as the authoritative contract for the SDK public API and integration pattern.',
    "Implement from those references first, then run the project's build or typecheck. Do not inspect node_modules, dependency source, build output, or declaration files merely to rediscover APIs already documented here.",
    "Inspect an installed package's public declarations only after a concrete build or type error indicates that the installed version differs from the bundled contract. Do not depend on private or unexported internals.",
    'Default to one shared renderer or component-mapper personalization boundary so every compatible content component is personalizable. Narrow that boundary only for a concrete architectural or safety reason, or when the user explicitly requests a smaller scope; document any exclusions.',
    'Keep the approved scope and do not add unrelated product UI or behavior.',
    "Preserve the application's ownership of consent, identity, and tracking. Reuse an existing consent source or UI when present; do not invent a new consent control unless the user explicitly approved one.",
  ];

  if (options.sdk === 'optimization' || options.sdk === 'mixed') {
    guidance.push(
      'Choose one Contentful entry ownership path for each integration: application-fetched `baselineEntry`, or SDK-managed `entryId` with a configured Contentful client. Do not mix both paths or configure managed fetching when the application already supplies `baselineEntry`.',
    );
  }

  if (options.workflowOwnsSetup) {
    guidance.push(
      'The workflow actions own package installation and environment-file updates. Do not run an additional package-manager command or rewrite environment files unless a later validation step reports a concrete failure and routes you to repair it.',
    );
  }

  return guidance.map((item) => `- ${item}`).join('\n');
}
