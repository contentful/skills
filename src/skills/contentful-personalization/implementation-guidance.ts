type SdkChoice = 'optimization' | 'ninetailed' | 'mixed' | 'unknown';

export function planPresentationGuidance(): string {
  return [
    'Start with a short **Decisions** section for cross-cutting choices such as entry ownership, rendering mode, consent ownership, and cache tradeoffs.',
    'Give every numbered step its own Markdown heading. Put the affected file or files on a separate line, then explain the outcome and reason in one to three short paragraphs or bullets.',
    'Leave a blank line between a heading, its file list, prose, and any code block. Do not pack an entire step into one bullet or paragraph.',
    'Keep inline code for paths, environment-variable names, public symbols, and genuinely short expressions only.',
    'Never squeeze a full function call, nested object literal, JSX tree, or multi-prop component into inline code or a prose bullet. When syntax materially clarifies the plan, use a language-labelled fenced code block with real line breaks and format it as the project formatter would.',
    'Show only load-bearing snippets needed to communicate the approach. A plan is not a compressed implementation or a dump of every eventual line of code.',
    'Put qualifications next to the step or decision they affect instead of collecting dense notes at the end.',
  ]
    .map((item) => `- ${item}`)
    .join('\n');
}

export function implementationGuidance(options: { sdk: SdkChoice; workflowOwnsSetup?: boolean }): string {
  const guidance = [
    'Treat the bundled Reference Material as the authoritative contract for the SDK public API and integration pattern.',
    "Implement from those references first, then run the project's build or typecheck. Do not inspect node_modules, dependency source, build output, or declaration files merely to rediscover APIs already documented here.",
    "Inspect an installed package's public declarations only after a concrete build or type error indicates that the installed version differs from the bundled contract. Do not depend on private or unexported internals.",
    'Discover every shared content-rendering boundary, including component or block mappers, section or page dispatchers, and rich-text renderers. Default to wrapping each compatible boundary so all supported content components are personalizable. Narrow the coverage only for a concrete architectural or safety reason, or when the user explicitly requests a smaller scope; document any exclusions.',
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
