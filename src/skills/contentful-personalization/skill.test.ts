import test from 'node:test';
import assert from 'node:assert/strict';
import { runComposite, runSkill, mockModel } from '@contentful/skill-kit/test';
import skill from './skill.js';
import { derivePackagesToInstall } from './actions/install-packages.js';
import doctorSkill from './subskills/doctor.js';
import developSkill from './subskills/develop.js';
import liveDebugSkill from './subskills/live-debug.js';

// --- Dispatcher routing tests ---

test('classify routes to onboard for setup requests', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'onboard',
        confidence: 0.95,
        reasoning: 'User wants to set up personalization',
      },
      'onboard/explore': {
        framework: 'nextjs-app',
        routerType: 'app',
        projectPath: '.',
        frameworkVersion: '14.0.0',
        explorationSummary: 'Next.js project',
        personalizableCandidates: [],
        existingSetup: 'none',
        readinessOnly: true,
      },
      'onboard/assess': {
        readinessStatus: 'ready',
        report: 'All good',
        prerequisites: [],
        readinessOnly: true,
      },
      'onboard/gate': { message: 'Readiness check complete' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'onboard');
  assert.ok(result.path.includes('classify'));
});

test('classify routes to doctor for debugging requests', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'doctor',
        confidence: 0.9,
        reasoning: 'User says personalization is broken',
      },
      'doctor/explore': {
        framework: 'nextjs-app',
        projectPath: '.',
        explorationSummary: 'Broken setup',
        concerns: ['No provider'],
      },
      'doctor/scan-credentials': {
        envVars: [{ name: 'NINETAILED_API_KEY', status: 'missing' }],
      },
      'doctor/confirm-credentials': { hasCredentials: false },
      'doctor/review': { overallStatus: 'fail', recommendations: [], summary: 'Needs fixes' },
      'doctor/report': { choice: 'no' },
      'doctor/done': { message: 'Ok' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'doctor');
});

test('classify routes to develop for component tasks', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'develop',
        confidence: 0.85,
        reasoning: 'User wants to personalize a component',
      },
      'develop/analyze': {
        taskType: 'personalize-component',
        sdkInUse: 'ninetailed',
        framework: 'nextjs-app',
        targetFiles: ['Hero.tsx'],
        analysis: 'Wrap Hero',
      },
      'develop/plan': {
        approved: true,
        plan: 'Add Experience wrapper',
        filesToModify: ['Hero.tsx'],
      },
      'develop/implement': { filesModified: ['Hero.tsx'], summary: 'Done' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'develop');
});

test('classify routes live URL requests to live-debug', async () => {
  const result = await runComposite(skill, {
    host: { toolsAvailable: [] },
    model: mockModel({
      classify: {
        intent: 'live-debug',
        confidence: 0.97,
        requestedUrl: 'https://example.com/personalized',
        reasoning: 'User explicitly asked to inspect a live URL',
      },
      'live-debug/check-mcp': {
        mcpAvailable: false,
        reason: 'No browser debugging tools were available.',
      },
      'live-debug/install-mcp': { message: 'Install Chrome DevTools MCP and rerun' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'live-debug');
  assert.ok(result.path.includes('live-debug/check-mcp'));
  assert.ok(result.path.includes('live-debug/install-mcp'));
  assert.ok(!result.path.includes('doctor/explore'));
});

test('classify routes to topic for reference questions', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'reference',
        confidence: 0.9,
        topic: 'sdk-selection',
        reasoning: 'User asks which SDK to use',
      },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'topic');
  assert.equal(result.redirectedTo?.name, 'sdk-selection');
});

test('low confidence routes to gather-context', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: { intent: 'unclear', confidence: 0.3, reasoning: 'Ambiguous request' },
      'gather-context': { intent: 'doctor', reasoning: 'Found broken setup' },
      'doctor/explore': {
        framework: 'nextjs-app',
        projectPath: '.',
        explorationSummary: 'Broken',
        concerns: [],
      },
      'doctor/scan-credentials': {
        envVars: [{ name: 'NINETAILED_API_KEY', status: 'missing' }],
      },
      'doctor/confirm-credentials': { hasCredentials: false },
      'doctor/review': { overallStatus: 'warn', recommendations: [], summary: 'Issues found' },
      'doctor/report': { choice: 'no' },
      'doctor/done': { message: 'Ok' },
    }),
  });

  assert.ok(result.path.includes('gather-context'));
  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'doctor');
});

test('reference without topic routes to pick-topic', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: { intent: 'reference', confidence: 0.8, reasoning: 'User wants to look something up' },
      'pick-topic': { choice: 'common-errors' },
    }),
  });

  assert.ok(result.path.includes('pick-topic'));
  assert.equal(result.redirectedTo?.kind, 'topic');
  assert.equal(result.redirectedTo?.name, 'common-errors');
});

test('live-debug uses provided URL and finishes when runtime looks healthy', async () => {
  const result = await runSkill(liveDebugSkill, {
    params: { requestedUrl: 'https://example.com/personalized' },
    host: {
      toolsAvailable: [
        'mcp__chrome-devtools__new_page',
        'mcp__chrome-devtools__list_console_messages',
        'mcp__chrome-devtools__list_network_requests',
      ],
    },
    model: mockModel({
      'check-mcp': {
        mcpAvailable: true,
        reason: 'The host exposes page control plus console and network inspection tools.',
      },
      inspect: {
        url: 'https://example.com/personalized',
        overallStatus: 'pass',
        summary: 'Runtime behavior looks healthy.',
        consoleSummary: 'No meaningful console issues.',
        requestCount: 1,
        requests: [
          {
            url: 'https://experience.ninetailed.co/v1/events',
            method: 'POST',
            status: 200,
            summary: 'Page-level event with basic page metadata',
          },
        ],
        findings: [{ item: 'experience.ninetailed.co request', status: 'pass', detail: 'Observed one successful POST request.' }],
        recommendations: [],
        shouldRunDoctor: false,
      },
      report: { message: 'Looks healthy' },
    }),
  });

  assert.deepEqual(result.path, ['check-mcp', 'inspect', 'report']);
  assert.ok(!result.path.includes('request-url'));
});

test('live-debug asks for URL when one was not provided', async () => {
  const result = await runSkill(liveDebugSkill, {
    host: {
      toolsAvailable: [
        'mcp__chrome-devtools__new_page',
        'mcp__chrome-devtools__list_console_messages',
        'mcp__chrome-devtools__list_network_requests',
      ],
    },
    model: mockModel({
      'check-mcp': {
        mcpAvailable: true,
        reason: 'The host exposes page control plus console and network inspection tools.',
      },
      'request-url': { url: 'https://example.com/live' },
      inspect: {
        url: 'https://example.com/live',
        overallStatus: 'pass',
        summary: 'Runtime behavior looks healthy.',
        consoleSummary: 'No meaningful console issues.',
        requestCount: 0,
        requests: [],
        findings: [{ item: 'experience.ninetailed.co request', status: 'warn', detail: 'No matching requests were detected during this check.' }],
        recommendations: [{ priority: 'info', message: 'Retry the page with known personalized content if you expected network activity.', category: 'runtime' }],
        shouldRunDoctor: false,
      },
      report: { message: 'Done' },
    }),
  });

  assert.deepEqual(result.path, ['check-mcp', 'request-url', 'inspect', 'report']);
});

test('live-debug recommends doctor when runtime looks suspicious', async () => {
  const result = await runSkill(liveDebugSkill, {
    params: { requestedUrl: 'https://example.com/personalized' },
    host: {
      toolsAvailable: [
        'mcp__chrome-devtools__new_page',
        'mcp__chrome-devtools__list_console_messages',
        'mcp__chrome-devtools__list_network_requests',
      ],
    },
    model: mockModel({
      'check-mcp': {
        mcpAvailable: true,
        reason: 'The host exposes page control plus console and network inspection tools.',
      },
      inspect: {
        url: 'https://example.com/personalized',
        overallStatus: 'warn',
        summary: 'The page showed runtime symptoms that look like a setup issue.',
        consoleSummary: 'Console warnings suggest the personalization provider is not configured correctly.',
        requestCount: 0,
        requests: [],
        findings: [
          {
            item: 'experience.ninetailed.co request',
            status: 'fail',
            detail: 'No matching requests were sent after page load and one reload.',
          },
        ],
        recommendations: [
          {
            priority: 'warning',
            message: 'No requests to experience.ninetailed.co were observed. Check provider setup, middleware, and runtime SDK wiring.',
            category: 'runtime',
          },
        ],
        shouldRunDoctor: true,
      },
      report: { message: 'Run doctor next' },
    }),
  });

  assert.deepEqual(result.path, ['check-mcp', 'inspect', 'report']);
});

// --- Doctor sub-skill tests ---

test('doctor: no credentials → code-only review → report → done', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Next.js 14 App Router project with partial Ninetailed setup',
        concerns: ['Provider not found', 'Missing middleware'],
      },
      'scan-credentials': {
        envVars: [{ name: 'NINETAILED_API_KEY', status: 'missing' }],
      },
      'confirm-credentials': { hasCredentials: false },
      review: {
        overallStatus: 'warn',
        recommendations: [{ priority: 'warning', message: 'Provider not found in source', category: 'provider' }],
        summary: 'Partial setup detected.',
      },
      report: { choice: 'no' },
      done: { message: 'Good luck!' },
    }),
  });

  assert.ok(result.path.includes('explore'));
  assert.ok(result.path.includes('scan-credentials'));
  assert.ok(result.path.includes('confirm-credentials'));
  assert.ok(!result.path.includes('check-api'));
  assert.ok(result.path.includes('review'));
  assert.ok(result.path.includes('report'));
  assert.ok(result.path.includes('done'));
});

test('doctor: with credentials → API check → skip inspection → review', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Setup looks correct',
        concerns: [],
      },
      'scan-credentials': {
        envVars: [
          { name: 'NINETAILED_API_KEY', status: 'set', maskedValue: 'nt_prod_****' },
          { name: 'CONTENTFUL_SPACE_ID', status: 'set', maskedValue: 'space123****' },
        ],
        personalization: { apiKey: 'nt_prod_test123' },
        contentful: { spaceId: 'space123' },
      },
      'confirm-credentials': {
        hasCredentials: true,
        personalization: { apiKey: 'nt_prod_test123', environment: 'main' },
        contentful: { spaceId: 'space123', accessToken: 'token1', environment: 'master' },
      },
      'check-api': {
        status: 'pass',
        findings: [{ item: 'Experience API v3', status: 'pass', detail: 'Reachable (120ms)' }],
        reachable: true,
        responseTimeMs: 120,
      },
      triage: { choice: 'skip', problemDescription: 'Just checking' },
      review: { overallStatus: 'pass', recommendations: [], summary: 'All good.' },
      report: { choice: 'no' },
      done: { message: 'All clear' },
    }),
  });

  assert.ok(result.path.includes('check-api'));
  assert.ok(result.path.includes('triage'));
  assert.ok(!result.path.includes('choose-entry'));
  assert.ok(result.path.includes('review'));
});

test('doctor: with credentials → inspect entry → review', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Setup looks correct',
        concerns: [],
      },
      'scan-credentials': {
        envVars: [
          { name: 'CONTENTFUL_SPACE_ID', status: 'set', maskedValue: 'space123****' },
          { name: 'CONTENTFUL_ACCESS_TOKEN', status: 'set', maskedValue: 'token12****' },
        ],
        contentful: { spaceId: 'space123', accessToken: 'token1' },
      },
      'confirm-credentials': {
        hasCredentials: true,
        contentful: { spaceId: 'space123', accessToken: 'token1', environment: 'master' },
        personalization: { apiKey: 'nt_key', environment: 'main' },
      },
      'check-api': {
        status: 'skip',
        findings: [{ item: 'Ninetailed API', status: 'skip', detail: 'No API key' }],
        reachable: false,
      },
      triage: { choice: 'inspect-entry', problemDescription: 'Variants not showing' },
      'choose-entry': { entryId: 'abc123', skip: false },
      'run-inspection': { status: 'pass', findings: [], entry: { id: 'abc123' } },
      review: {
        overallStatus: 'fail',
        recommendations: [{ priority: 'critical', message: 'Entry has unpublished changes', category: 'content' }],
        summary: 'Unpublished changes detected.',
      },
      report: { choice: 'no' },
      done: { message: 'Ok' },
    }),
  });

  assert.ok(result.path.includes('choose-entry'));
  assert.ok(result.path.includes('run-inspection'));
  assert.ok(result.path.includes('review'));
});

test('doctor: choose-entry skip → review (no entry provided)', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Setup looks correct',
        concerns: [],
      },
      'scan-credentials': {
        envVars: [{ name: 'CONTENTFUL_SPACE_ID', status: 'set', maskedValue: 'space****' }],
        contentful: { spaceId: 'space1', accessToken: 'token1' },
      },
      'confirm-credentials': {
        hasCredentials: true,
        contentful: { spaceId: 'space1', accessToken: 'token1', environment: 'master' },
        personalization: { apiKey: 'nt_key', environment: 'main' },
      },
      'check-api': {
        status: 'skip',
        findings: [{ item: 'Ninetailed API', status: 'skip', detail: 'No credentials' }],
        reachable: false,
      },
      triage: { choice: 'inspect-entry', problemDescription: 'Not sure what is wrong' },
      'choose-entry': { skip: true },
      review: { overallStatus: 'pass', recommendations: [], summary: 'Everything looks good.' },
      report: { choice: 'no' },
      done: { message: 'All clear' },
    }),
  });

  assert.ok(result.path.includes('choose-entry'));
  assert.ok(!result.path.includes('run-inspection'));
  assert.ok(result.path.includes('review'));
});

// --- Develop sub-skill tests ---

test('develop analyze → plan → implement path', async () => {
  const result = await runSkill(developSkill, {
    params: { userQuery: 'Personalize the Hero component' },
    model: mockModel({
      analyze: {
        taskType: 'personalize-component',
        sdkInUse: 'ninetailed',
        framework: 'nextjs-app',
        targetFiles: ['components/Hero.tsx', 'components/BlockRenderer.tsx'],
        analysis: 'Hero component needs Experience wrapper',
      },
      plan: {
        approved: true,
        plan: 'Wrap Hero in Experience component, add to ContentTypeMap',
        filesToModify: ['components/Hero.tsx', 'components/BlockRenderer.tsx'],
      },
      implement: {
        filesModified: ['components/Hero.tsx', 'components/BlockRenderer.tsx'],
        summary: 'Added Experience wrapper to Hero',
      },
    }),
  });

  assert.deepEqual(result.path, ['analyze', 'plan', 'implement']);
});

test('derivePackagesToInstall uses react package for React ninetailed installs', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'ninetailed',
      framework: 'react',
      architecture: 'client-only',
    }),
    ['@ninetailed/experience.js', '@ninetailed/experience.js-react', '@ninetailed/experience.js-plugin-insights'],
  );
});

test('derivePackagesToInstall keeps frameworkless ninetailed installs core-only', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'ninetailed',
      framework: 'other',
      architecture: 'client-only',
    }),
    ['@ninetailed/experience.js', '@ninetailed/experience.js-plugin-insights'],
  );
});

test('derivePackagesToInstall uses the web SDK (not core) for non-react optimization installs', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'other',
      architecture: 'hybrid-ssr',
    }),
    ['@contentful/optimization-web', '@contentful/optimization-node'],
  );
});

test('derivePackagesToInstall uses web-only for non-react client-only optimization installs', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'other',
      architecture: 'client-only',
    }),
    ['@contentful/optimization-web'],
  );
});

test('derivePackagesToInstall uses the Next.js adapter for all Next.js optimization installs', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'nextjs-app',
      architecture: 'hybrid-ssr',
    }),
    ['@contentful/optimization-nextjs'],
  );

  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'nextjs-pages',
      architecture: 'client-only',
    }),
    ['@contentful/optimization-nextjs'],
  );
});

test('derivePackagesToInstall uses react-web for client-only React optimization installs', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'react',
      architecture: 'client-only',
    }),
    ['@contentful/optimization-react-web'],
  );
});

test('derivePackagesToInstall adds the node SDK for server-involved React optimization installs', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'remix',
      architecture: 'server-only',
    }),
    ['@contentful/optimization-react-web', '@contentful/optimization-node'],
  );
});
