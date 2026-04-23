import { skill, z, prompt, render, askUser } from '@contentful/skill-kit';
import { checkPackagesAndEnv } from '../actions/check-packages-env.js';
import { validateSetup } from '../actions/validate-setup.js';
import { installPackages } from '../actions/install-packages.js';
import { writeEnvFile } from '../actions/write-env-file.js';
import { PackagesAndEnvResult, ReadinessStatus } from '../schemas.js';

export default skill({
  name: 'onboard',
  version: '1.0.0',
  description:
    'Assess readiness and guide Contentful personalization setup end-to-end. ' +
    'Explores the codebase, checks readiness, helps choose SDK and architecture, ' +
    'installs packages, and guides implementation.',
  entry: 'explore',

  context: z.object({
    userQuery: z.string().optional(),
    readinessOnly: z.boolean().optional(),
  }),

  stash: z.object({
    framework: z.string(),
    routerType: z.enum(['app', 'pages', 'hybrid', 'none']),
    projectPath: z.string(),
    packageData: PackagesAndEnvResult.optional(),
    readinessStatus: ReadinessStatus.optional(),
    readinessOnly: z.boolean(),
    sdkChoice: z.enum(['ninetailed', 'optimization']).optional(),
    architecture: z.enum(['client-only', 'hybrid-ssr', 'server-only']).optional(),
  }),
})
  .step('explore', {
    prompt: ({ context, refs }) => prompt`
      Explore this project to build a thorough understanding of its structure,
      how it uses Contentful, and what personalization would look like here.

      ${refs.load('how-personalization-works.md')}

      ${refs.load('component-patterns.md')}

      ${refs.load('framework-notes.md')}

      Investigate:

      1. **Framework & version**: Read package.json, check for app/ vs pages/
         directories, next.config, gatsby-config, remix.config, etc.

      2. **Contentful integration**: Find the Contentful client configuration.
         How is content fetched? What include depth? Is there a preview client?
         Where are the env vars configured?

      3. **Component architecture**: Find the component mapper pattern
         (ContentTypeMap, BlockRenderer, ComponentRenderer, etc.). Are components
         isolated (props in, JSX out)? Do they fetch their own data?

      4. **Rendering pipeline**: Page-level or component-level fetching?
         SSR, SSG, ISR, or client-only? Is there existing middleware?

      5. **Existing personalization**: Any NinetailedProvider, Experience
         components, ExperienceMapper usage, or @contentful/optimization code?

      6. **Credentials approach**: How does the project manage env vars
         and secrets? .env files? Vercel env? Other?

      Think about what personalization would look like in THIS project.
      Which components would benefit? Where would the provider go?
      What architecture makes sense?

      ${context?.userQuery ? `The user's request: "${context.userQuery}"` : ''}
      ${context?.readinessOnly ? 'Note: The user is only asking about readiness, not requesting a full setup.' : ''}
    `,
    output: z.object({
      framework: z.enum(['nextjs-app', 'nextjs-pages', 'nextjs-hybrid', 'gatsby', 'remix', 'other']),
      frameworkVersion: z.string().optional(),
      routerType: z.enum(['app', 'pages', 'hybrid', 'none']),
      projectPath: z.string(),
      explorationSummary: z.string(),
      personalizableCandidates: z.array(z.string()),
      existingSetup: z.enum(['none', 'partial', 'configured']),
      readinessOnly: z.boolean(),
    }),
    stash: ({ output }) => ({
      framework: output.framework,
      routerType: output.routerType,
      projectPath: output.projectPath,
      readinessOnly: output.readinessOnly,
    }),
    next: 'check-packages',
  })

  .step('check-packages', {
    prompt: ({ stash }) => prompt`
      Confirm the project path for the package and env var check.
      Project path: ${stash.projectPath}
    `,
    output: z.object({ projectPath: z.string() }),
    action: checkPackagesAndEnv,
    afterAction: ({ action }) => ({ packageData: action }),
    next: 'assess',
  })

  .step('assess', {
    prompt: ({ stash, getStep, refs }) => {
      const explore = getStep('explore');

      return prompt`
        Combine your exploration findings with the package/env data to produce
        a readiness assessment.

        ## Readiness Rubric
        ${refs.load('readiness-criteria.md')}

        ## Your Exploration Findings
        ${explore?.output ? JSON.stringify(explore.output, null, 2) : 'No exploration data'}

        ## Package & Env Var Data (deterministic)
        ${JSON.stringify(stash.packageData, null, 2)}

        Assess these five areas:
        A. **Framework**: Supported? Version adequate?
        B. **Contentful SDK**: Installed? Client configured? Include depth?
        C. **Existing Ninetailed/Optimization**: What's the current state?
        D. **Component Architecture**: Mapper present? Components isolated?
        E. **Rendering Pipeline**: Page-level fetching? Include depth adequate?

        For each area, give a status and explain what you found.
        Be conversational — explain WHY things matter, not just pass/fail.

        Overall status:
        - "ready" if all good
        - "minor-changes" if small fixes needed
        - "needs-work" if moderate restructuring required
        - "not-ready" if significant work needed before personalization is viable

      Also determine: is the user only asking about readiness (not requesting
      a full setup)? Set readinessOnly accordingly.
      `;
    },
    output: z.object({
      readinessStatus: ReadinessStatus,
      report: z.string(),
      prerequisites: z.array(z.string()),
      readinessOnly: z.boolean(),
    }),
    stash: ({ output }) => ({ readinessStatus: output.readinessStatus }),
    next: ({ output }) => {
      const status = output.readinessStatus;
      if (status === 'not-ready' || status === 'needs-work') return 'gate';
      if (output.readinessOnly) return 'gate';
      return 'choose';
    },
  })

  .step('gate', {
    prompt: ({ rendered }) => prompt`
      Present the readiness report to the user exactly as rendered.
      If the status is positive but they only asked about readiness,
      mention they can come back when ready to set up.
      If the status indicates issues, explain what needs fixing first.

      ${rendered ?? ''}
    `,
    output: z.object({ message: z.string() }),
    render: ({ stash, getStep }) => {
      const assess = getStep<{ readinessStatus: string; report: string; prerequisites: string[] }>('assess');
      if (!assess?.output) return '## Readiness Report\n\nNo assessment data available.';

      const icon = stash.readinessStatus === 'ready' || stash.readinessStatus === 'minor-changes' ? '✅' : '⚠️';
      const sections: string[] = [];
      sections.push(`## Readiness Report ${icon}\n`);
      sections.push(assess.output.report);

      if (assess.output.prerequisites.length > 0) {
        sections.push(render.section('Prerequisites', assess.output.prerequisites.map((p, i) => `${i + 1}. ${p}`).join('\n')));
      }

      if (stash.readinessStatus === 'ready' || stash.readinessStatus === 'minor-changes') {
        sections.push('\n---\nYour project is ready for personalization. Run this skill again when you want to start setup.');
      }

      return sections.join('\n\n');
    },
    next: { terminal: true },
  })

  .step('choose', {
    prompt: ({ stash, getStep, refs }) => {
      const explore = getStep('explore');

      return prompt`
        Help the user choose their SDK and architecture. Use the reference
        below for the decision framework, but make a specific recommendation
        based on what you learned about their project.

        ${refs.load('sdk-selection.md')}

        ## Project Context
        Framework: ${stash.framework}
        Router: ${stash.routerType}
        ${explore?.output ? `Exploration: ${(explore.output as { explorationSummary: string }).explorationSummary}` : ''}

        Make a recommendation and explain your reasoning. Confirm with the user.
        For SDK choice: current (@ninetailed/experience.js) or modern (@contentful/optimization).
        For architecture: client-only, hybrid SSR/edge + client, or server-only.
      `;
    },
    output: z.object({
      sdkChoice: z.enum(['ninetailed', 'optimization']),
      architecture: z.enum(['client-only', 'hybrid-ssr', 'server-only']),
      reasoning: z.string(),
    }),
    stash: ({ output }) => ({
      sdkChoice: output.sdkChoice,
      architecture: output.architecture,
    }),
    next: 'cms-setup',
  })

  .step('cms-setup', {
    prompt: ({ refs }) => prompt`
      Guide the user through the Contentful app installation.
      You cannot do this yourself — these are steps the user must
      perform in the Contentful web UI.

      ${refs.load('contentful-app-setup.md')}

      Present a clear, numbered checklist. Ask the user to confirm
      when they've completed the Contentful side of setup.
    `,
    ask: askUser({
      type: 'structured',
      question: 'Have you completed the Contentful app setup (installed the app, selected data bucket, extended content types)?',
      options: [
        { value: 'done', label: 'Yes, Contentful setup is complete' },
        { value: 'help', label: 'I need more guidance' },
      ],
    }),
    output: z.object({ choice: z.enum(['done', 'help']) }),
    next: ({ output, attempts }) => {
      if (output.choice === 'done') return 'plan';
      if (attempts >= 3) return 'plan';
      return 'cms-setup';
    },
  })

  .step('plan', {
    prompt: ({ stash, refs }) => {
      const refSections = [
        refs.load('env-var-spec.md'),
        refs.load('provider-patterns.md'),
        refs.load('rendering-pipeline.md'),
      ];

      if (stash.architecture === 'hybrid-ssr') {
        refSections.push(refs.load('middleware-patterns.md'));
        refSections.push(refs.load('ssr-guide.md'));
      }

      refSections.push(refs.load('analytics-and-preview.md'));
      refSections.push(refs.load('implementation-examples.md'));

      return prompt`
        Present an implementation plan. Use planning mode to lay out a thorough,
        step-by-step plan and get the user's approval before proceeding.

        ## Decisions Made
        SDK: ${stash.sdkChoice}
        Architecture: ${stash.architecture}
        Framework: ${stash.framework} (${stash.routerType} router)

        ## Reference Material
        ${refSections.join('\n\n---\n\n')}

        The plan should specify:
        1. Exact packages to install
        2. Environment variables to set (with placeholder values)
        3. Provider placement (which file, how to structure)
        4. Component wiring changes
        ${stash.architecture === 'hybrid-ssr' ? '5. Middleware setup (matcher, cookies, preflight)' : ''}
        ${stash.architecture !== 'server-only' ? '6. Analytics/insights plugin setup' : ''}
        7. Verification steps

        Be specific about file paths based on what you found during exploration.
      `;
    },
    output: z.object({
      packagesToInstall: z.array(z.string()),
      envVars: z.record(z.string(), z.string()),
      plan: z.string(),
    }),
    next: 'install',
  })

  .step('install', {
    prompt: ({ stash, getStep }) => {
      const plan = getStep('plan');
      const packages = (plan?.output as { packagesToInstall: string[] } | undefined)?.packagesToInstall ?? [];

      return prompt`
        Install packages and write env vars. Return the project path,
        packages, and package manager for the install action.

        Packages to install: ${JSON.stringify(packages)}
        Package manager detected: ${stash.packageData?.packageManager ?? 'npm'}
        Project path: ${stash.projectPath}
      `;
    },
    output: z.object({
      projectPath: z.string(),
      packages: z.array(z.string()),
      packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']),
    }),
    action: installPackages,
    next: 'write-env',
  })

  .step('write-env', {
    prompt: ({ stash, getStep }) => {
      const plan = getStep('plan');
      const envVars = (plan?.output as { envVars: Record<string, string> } | undefined)?.envVars ?? {};

      return prompt`
        Write environment variables. Return the project path, variables,
        and target file name for the writeEnvFile action.

        Variables to write: ${JSON.stringify(envVars)}
        Project path: ${stash.projectPath}
      `;
    },
    output: z.object({
      projectPath: z.string(),
      variables: z.record(z.string(), z.string()),
      fileName: z.string(),
    }),
    action: writeEnvFile,
    next: 'implement',
  })

  .step('implement', {
    prompt: ({ stash, refs }) => {
      const refSections = [
        refs.load('provider-patterns.md'),
        refs.load('rendering-pipeline.md'),
        refs.load('component-patterns.md'),
      ];

      if (stash.architecture === 'hybrid-ssr') {
        refSections.push(refs.load('middleware-patterns.md'));
      }

      if (stash.sdkChoice === 'ninetailed') {
        refSections.push(refs.load('sdk-legacy-guide.md'));
      } else {
        refSections.push(refs.load('sdk-next-guide.md'));
      }

      refSections.push(refs.load('implementation-examples.md'));

      return prompt`
        Implement the personalization setup. Write the code changes needed:

        - Provider wrapper (adapt to the project's patterns and conventions)
        - Component wiring (Experience/Personalize components, ExperienceMapper)
        ${stash.architecture === 'hybrid-ssr' ? '- Middleware with preflight, cookie management, matcher config' : ''}
        - Analytics plugin configuration
        - Any rendering pipeline adjustments (include depth, component mapper)

        SDK: ${stash.sdkChoice}
        Architecture: ${stash.architecture}
        Framework: ${stash.framework} (${stash.routerType} router)

        ## Reference
        ${refSections.join('\n\n---\n\n')}

        Adapt to the project's existing patterns. Don't force a different style
        than what the codebase already uses.
      `;
    },
    output: z.object({
      filesModified: z.array(z.string()),
      summary: z.string(),
    }),
    next: 'verify',
  })

  .step('verify', {
    prompt: ({ stash, refs }) => prompt`
      Verify the setup. Confirm the project path for validation.
      Project path: ${stash.projectPath}

      After the deterministic check, also manually verify:

      ${refs.load('common-errors.md')}

      - Provider wraps the correct subtree
      - No hydration mismatch patterns
      - Page tracking happens once per navigation
      - Include depth is adequate
      - Middleware matcher excludes static assets (if applicable)
    `,
    output: z.object({ projectPath: z.string() }),
    action: validateSetup,
    next: ({ action, attempts }) => {
      const result = action as { overallStatus: string } | undefined;
      if (result?.overallStatus === 'pass') return 'report';
      if (attempts >= 3) return 'report';
      return 'fix';
    },
  })

  .step('fix', {
    prompt: ({ stash, refs }) => prompt`
      Fix the issues found during verification. For package/env issues,
      use the installPackages or writeEnvFile actions. For code issues,
      make the changes directly.

      ## Reference
      ${refs.load('common-errors.md')}

      Framework: ${stash.framework}
      Project: ${stash.projectPath}
    `,
    output: z.object({
      fixesMade: z.array(z.string()),
    }),
    next: 'verify',
  })

  .step('report', {
    prompt: ({ rendered }) => prompt`
      Present the setup completion report to the user.

      ${rendered ?? ''}
    `,
    output: z.object({ summary: z.string() }),
    render: ({ stash, getStep }) => {
      const impl = getStep<{ filesModified: string[]; summary: string }>('implement');
      const verify = getStep('verify');

      const sections: string[] = [];
      sections.push('## Setup Complete ✅\n');

      if (impl?.output) {
        sections.push(render.section('What was done', impl.output.summary));
        if (impl.output.filesModified.length > 0) {
          sections.push(render.section('Files modified', impl.output.filesModified.map((f) => `- ${f}`).join('\n')));
        }
      }

      sections.push(render.section('Configuration', [
        `SDK: ${stash.sdkChoice}`,
        `Architecture: ${stash.architecture}`,
        `Framework: ${stash.framework} (${stash.routerType})`,
      ].join('\n')));

      if (verify?.action) {
        const v = verify.action as { overallStatus: string; summary: string };
        sections.push(render.section('Verification', `Status: ${v.overallStatus}\n${v.summary}`));
      }

      sections.push(render.section('Next Steps', [
        '1. Create experiences and audiences in the Contentful Personalization app',
        '2. Publish your content with personalization variants',
        '3. Test in preview mode before going live',
        '4. Monitor analytics and experiment results',
      ].join('\n')));

      return sections.join('\n\n');
    },
    next: { terminal: true },
  })

  .build();
