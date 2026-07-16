import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runComposite, runSkill, mockModel } from '@contentful/skill-kit/test';
import skill, { resolveInitialIntent } from './skill.js';
import { derivePackagesToInstall } from './actions/install-packages.js';
import { getOptimizationReferenceFiles } from './optimization-references.js';
import doctorSkill, { resolveCredentials, resolveDoctorRerunStages } from './subskills/doctor.js';
import extendExistingSkill, {
  resolveDevelopmentSdk,
  resolveDevelopmentValidationProfile,
} from './subskills/develop.js';
import liveDebugSkill from './subskills/live-debug.js';
import { buildLiveEventsUrl, hasInventoriedOutcomeScenario, resolveRecommendedSdkChoice } from './subskills/onboard.js';

const finishedApplication = {
  applicationUrl: 'http://localhost:3000/',
  serverStatus: 'started' as const,
  browserStatus: 'opened-visible' as const,
  liveEventsStatus: 'opened-visible' as const,
  summary: 'The finished application is open for inspection.',
  checks: ['Initial page rendered'],
  issues: [],
};

// --- Dispatcher routing tests ---

test('onboard builds the Contentful Live Events URL for the verified space and environment', () => {
  assert.equal(
    buildLiveEventsUrl('space id', 'feature/env'),
    'https://app.contentful.com/spaces/space%20id/environments/feature%2Fenv/apps/app_installations/contentful-personalization/analytics/realtime',
  );
  assert.equal(buildLiveEventsUrl(undefined, 'master'), undefined);
});

test('onboard only accepts end-to-end outcome confirmation for an inventoried CMS scenario', () => {
  assert.equal(hasInventoriedOutcomeScenario(undefined), false);
  assert.equal(hasInventoriedOutcomeScenario({ kind: 'unavailable' }), false);
  assert.equal(hasInventoriedOutcomeScenario({ kind: 'fixture-needed' }), false);
  assert.equal(hasInventoriedOutcomeScenario({ kind: 'preview-only' }), true);
  assert.equal(hasInventoriedOutcomeScenario({ kind: 'existing-targeted' }), true);
});

test('classify routes a readiness-only question to onboard and stops at the gate', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'onboard',
        setupContext: 'not-established',
        confidence: 0.95,
        userQuery: 'Am I ready for personalization?',
        readinessOnly: true,
        reasoning: 'User is only asking whether the project is ready',
      },
      'onboard/explore': {
        framework: 'nextjs-app',
        routerType: 'app',
        projectPath: '.',
        frameworkVersion: '14.0.0',
        explorationSummary: 'Next.js project',
        personalizableCandidates: [],
        renderingBoundaries: ['src/components/renderer/SectionRenderer.tsx'],
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
  // Readiness-only never touches credential review; it stops at the terminal gate.
  assert.ok(result.path.indexOf('onboard/scan-credentials') < result.path.indexOf('onboard/assess'));
  assert.ok(result.path.indexOf('onboard/assess') < result.path.indexOf('onboard/gate'));
  assert.ok(!result.path.includes('onboard/review-readiness'));
  assert.ok(!result.path.includes('onboard/recommend'));
});

test('classify routes to doctor for debugging requests', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'doctor',
        setupContext: 'explicit-broken',
        confidence: 0.9,
        reasoning: 'User says personalization is broken',
      },
      'doctor/detect-sdk': {
        framework: 'nextjs-app',
        projectPath: '.',
      },
      'doctor/scan-credentials': {
        envVars: [{ name: 'OPTIMIZATION_CLIENT_ID', status: 'missing' }],
      },
      'doctor/confirm-credentials': { runCredentialChecks: false },
      'doctor/programmatic-gate': { choice: 'done', problemDescription: '' },
      'doctor/done': { message: 'Ok' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'doctor');
});

test('classify routes to extend-existing for a scoped task on a working setup', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'extend-existing',
        setupContext: 'explicit-working',
        confidence: 0.85,
        reasoning: 'User explicitly identified a working provider and wants to personalize another component',
      },
      'extend-existing/analyze': {
        taskType: 'personalize-component',
        sdkInUse: 'ninetailed',
        targetSdk: 'ninetailed',
        workScope: 'existing-integration',
        optimizationRuntime: 'unknown',
        optimizationArchitecture: 'unknown',
        framework: 'nextjs-app',
        projectPath: '.',
        mergeTagAuthoring: 'unknown',
        analyticsEvents: [],
        analyticsDestinations: [],
        renderingBoundaries: ['components/BlockRenderer.tsx'],
        targetFiles: ['Hero.tsx'],
        analysis: 'Wrap Hero',
      },
      'extend-existing/plan': {
        approved: false,
        plan: 'Add Experience wrapper',
        filesToModify: ['Hero.tsx'],
      },
      'extend-existing/declined': { message: 'No changes made' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'extend-existing');
});

test('bare implement-personalization requests cannot enter extend-existing', async () => {
  assert.equal(resolveInitialIntent('extend-existing', 'not-established'), 'onboard');

  const result = await runComposite(skill, {
    model: mockModel({
      classify: {
        intent: 'extend-existing',
        setupContext: 'not-established',
        confidence: 0.9,
        reasoning: 'The user said implement, but did not establish an existing working setup',
      },
      'onboard/explore': {
        framework: 'nextjs-app',
        routerType: 'app',
        projectPath: '.',
        frameworkVersion: '14.0.0',
        explorationSummary: 'Next.js project with no established personalization setup',
        personalizableCandidates: [],
        renderingBoundaries: ['src/components/renderer/SectionRenderer.tsx'],
        existingSetup: 'none',
        readinessOnly: true,
      },
      'onboard/assess': {
        readinessStatus: 'ready',
        report: 'Ready for project-wide implementation',
        prerequisites: [],
        readinessOnly: true,
      },
      'onboard/gate': { message: 'Readiness check complete' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'onboard');
});

test('classify routes live URL requests to live-debug', async () => {
  const result = await runComposite(skill, {
    host: { toolsAvailable: [] },
    model: mockModel({
      classify: {
        intent: 'live-debug',
        setupContext: 'not-established',
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
        setupContext: 'not-established',
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
      classify: {
        intent: 'unclear',
        setupContext: 'not-established',
        confidence: 0.3,
        reasoning: 'Ambiguous request',
      },
      'gather-context': { intent: 'doctor', reasoning: 'Found broken setup' },
      'doctor/detect-sdk': {
        framework: 'nextjs-app',
        projectPath: '.',
      },
      'doctor/scan-credentials': {
        envVars: [{ name: 'NINETAILED_API_KEY', status: 'missing' }],
      },
      'doctor/confirm-credentials': { runCredentialChecks: false },
      'doctor/programmatic-gate': { choice: 'done', problemDescription: '' },
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
      classify: {
        intent: 'reference',
        setupContext: 'not-established',
        confidence: 0.8,
        reasoning: 'User wants to look something up',
      },
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
        findings: [
          { item: 'experience.ninetailed.co request', status: 'pass', detail: 'Observed one successful POST request.' },
        ],
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
        findings: [
          {
            item: 'experience.ninetailed.co request',
            status: 'warn',
            detail: 'No matching requests were detected during this check.',
          },
        ],
        recommendations: [
          {
            priority: 'info',
            message: 'Retry the page with known personalized content if you expected network activity.',
            category: 'runtime',
          },
        ],
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
            detail: 'No matching requests were sent during passive page observation.',
          },
        ],
        recommendations: [
          {
            priority: 'warning',
            message:
              'No requests to experience.ninetailed.co were observed. Check provider setup, middleware, and runtime SDK wiring.',
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

test('live-debug requires approval before controlled side effects', async () => {
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
      'check-mcp': { mcpAvailable: true, reason: 'Browser inspection tools are available.' },
      inspect: {
        url: 'https://example.com/personalized',
        overallStatus: 'warn',
        summary: 'Consent blocks events during passive observation.',
        consoleSummary: 'No console errors.',
        requestCount: 0,
        requests: [],
        findings: [{ item: 'Consent', status: 'warn', detail: 'Events remain blocked.' }],
        recommendations: [],
        shouldRunDoctor: false,
        controlledValidationSuggested: true,
        controlledActions: ['accept-consent', 'reload'],
      },
      'offer-controlled-validation': { approved: false },
      report: { message: 'Passive report preserved' },
    }),
  });

  assert.deepEqual(result.path, ['check-mcp', 'inspect', 'offer-controlled-validation', 'report']);
  assert.ok(!result.path.includes('controlled-inspect'));
});

// --- Doctor sub-skill tests ---

// Modern @contentful/optimization app: programmatic checks pass, user investigates the
// codebase, which is where the problem turns out to be.
test('doctor: modern SDK, clean programmatic checks → explore-code → review → report → done', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      'detect-sdk': {
        framework: 'nextjs-app',
        frameworkVersion: '15.3.0',
        projectPath: '.',
      },
      'scan-credentials': {
        envVars: [
          { name: 'OPTIMIZATION_CLIENT_ID', status: 'set', maskedValue: '3ad32994' },
          { name: 'CONTENTFUL_SPACE_ID', status: 'set', maskedValue: 'ov5rm2sf' },
        ],
        optimization: { clientId: '3ad32994-25c6-43d0-a87f-bf7d5fd49a67', environment: 'main' },
        contentful: { spaceId: 'ov5rm2sf4eyi', accessToken: 'cda_token' },
      },
      'confirm-credentials': { runCredentialChecks: true },
      'programmatic-gate': { choice: 'explore-code', problemDescription: 'Variant never renders' },
      'explore-code': {
        explorationSummary: 'OptimizationRoot is missing from the root layout',
        concerns: ['OptimizationRoot provider not found'],
        renderingBoundaries: ['app/layout.tsx'],
      },
      review: {
        overallStatus: 'fail',
        recommendations: [
          { priority: 'critical', message: 'Add OptimizationRoot to the root layout', category: 'provider' },
        ],
        summary: 'Provider missing.',
      },
      report: { choice: 'no' },
      done: { message: 'Good luck!' },
    }),
  });

  assert.ok(result.path.includes('detect-sdk'));
  assert.ok(result.path.includes('scan-credentials'));
  assert.ok(result.path.includes('check-api'));
  assert.ok(result.path.includes('survey-content'));
  assert.ok(result.path.includes('programmatic-gate'));
  assert.ok(result.path.includes('explore-code'));
  assert.ok(result.path.includes('review'));
  assert.ok(result.path.includes('report'));
  assert.ok(result.path.includes('done'));
});

// Infra problem found and fixed → user confirms it's working → rerun affected evidence without code review.
test('doctor: fix-infra → ask-fixed (working) → affected validation, no code exploration', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      'detect-sdk': {
        framework: 'nextjs-app',
        frameworkVersion: '15.3.0',
        projectPath: '.',
      },
      'scan-credentials': {
        envVars: [{ name: 'OPTIMIZATION_CLIENT_ID', status: 'missing' }],
      },
      'confirm-credentials': { runCredentialChecks: false },
      'programmatic-gate': { choice: 'fix-infra', problemDescription: 'No personalization at all' },
      'fix-infra': {
        summary: 'Corrected the affected CMS graph configuration',
        filesModified: ['.env.local'],
        changedStages: ['cms-graph'],
      },
      'ask-fixed': { working: true },
      'begin-cms-rerun': {},
      're-present-runtime': finishedApplication,
      're-run-runtime': { choice: 'ready' },
      're-confirm-runtime': { choice: 'confirmed-end-to-end' },
      'validation-report': {
        profile: 'diagnostic-repair',
        finalState: 'validated-end-to-end',
        evidence: [],
        rerunStages: ['personalization-outcome'],
        summary: 'Validated end to end',
      },
    }),
  });

  assert.ok(result.path.includes('fix-infra'));
  assert.ok(result.path.includes('ask-fixed'));
  assert.ok(result.path.includes('begin-cms-rerun'));
  assert.ok(result.path.includes('re-survey-content'));
  assert.ok(result.path.includes('re-capture-live-events-baseline'));
  assert.ok(result.path.includes('re-present-runtime'));
  assert.ok(result.path.includes('re-run-runtime'));
  assert.ok(result.path.includes('re-capture-live-events'));
  assert.ok(result.path.includes('re-confirm-runtime'));
  assert.ok(result.path.includes('validation-report'));
  assert.ok(!result.path.includes('explore-code'));
  assert.ok(!result.path.includes('review'));
});

// Infra fix did not resolve it → fall through to codebase exploration.
test('doctor: fix-infra → ask-fixed (not working) → explore-code', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      'detect-sdk': {
        framework: 'nextjs-app',
        frameworkVersion: '15.3.0',
        projectPath: '.',
      },
      'scan-credentials': {
        envVars: [{ name: 'OPTIMIZATION_CLIENT_ID', status: 'set', maskedValue: '3ad32994' }],
        optimization: { clientId: '3ad32994-25c6-43d0-a87f-bf7d5fd49a67', environment: 'main' },
      },
      'confirm-credentials': { runCredentialChecks: true },
      'programmatic-gate': { choice: 'fix-infra', problemDescription: 'Still broken' },
      'fix-infra': { summary: 'Corrected the client ID value', filesModified: ['.env.local'] },
      'ask-fixed': { working: false },
      'explore-code': {
        explorationSummary: 'Middleware matcher catches static assets',
        concerns: ['Middleware matcher too broad'],
        renderingBoundaries: ['components/BlockRenderer.tsx'],
      },
      review: {
        overallStatus: 'warn',
        recommendations: [{ priority: 'warning', message: 'Tighten the middleware matcher', category: 'middleware' }],
        summary: 'Middleware misconfigured.',
      },
      report: { choice: 'no' },
      done: { message: 'Ok' },
    }),
  });

  assert.ok(result.path.includes('fix-infra'));
  assert.ok(result.path.includes('ask-fixed'));
  assert.ok(result.path.includes('explore-code'));
  assert.ok(result.path.includes('review'));
});

// run-inspection (and scan-credentials) are ACTION steps: runSkill executes the real actions,
// so the mock can't inject their results. To exercise the drill-down transition we (1) point the
// project at a temp dir with a real .env.local so scanCredentials extracts usable tokens, and
// (2) stub globalThis.fetch so the real inspectContent returns the status each test needs.
function withProjectEnv(): { projectPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'doctor-test-'));
  writeFileSync(
    join(dir, '.env.local'),
    [
      'NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID=client-uuid',
      'NEXT_PUBLIC_CONTENTFUL_SPACE_ID=space123',
      'NEXT_PUBLIC_CONTENTFUL_TOKEN=cda-token',
      'NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN=cpa-token',
    ].join('\n'),
  );
  return { projectPath: dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function makeDrillDownModel(projectPath: string, extra: Record<string, unknown>) {
  return mockModel({
    'detect-sdk': { framework: 'nextjs-app', frameworkVersion: '15.3.0', projectPath },
    'confirm-credentials': { runCredentialChecks: true },
    'programmatic-gate': { choice: 'inspect-entry', problemDescription: 'Hero personalization does nothing' },
    'choose-entry': { entryId: 'perch-sec-hero-home', skip: false },
    ...extra,
  });
}

function entryResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Fetch stub: list/survey queries return empty; the inspected entry has a draft-only baseline link
// (published has no nt_experiences, preview has it) → inspectContent returns 'fail'.
function stubDraftOnlyLink() {
  const baseEntry = { sys: { id: 'perch-sec-hero-home', contentType: { sys: { id: 'hero' } } } };
  return async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    // Experience API connectivity probe.
    if (url.hostname.includes('ninetailed.co')) return entryResponse({});
    // Single-entry inspection (path ends with the entry id).
    if (url.pathname.includes('/entries/perch-sec-hero-home')) {
      return url.hostname.includes('cdn.contentful.com')
        ? entryResponse({ ...baseEntry, fields: { title: 'Hero' } })
        : entryResponse({
            ...baseEntry,
            fields: { title: 'Hero', nt_experiences: [{ sys: { type: 'Link', linkType: 'Entry', id: 'exp1' } }] },
          });
    }
    // survey-content list queries → no experiences, keeps the survey out of the way.
    return entryResponse({ items: [] });
  };
}

// Drill-down with a CONFIRMED content problem → fix-first, verify, done. Must NOT railroad
// into a codebase exploration the way it used to.
test('doctor: drill-down confirms content problem → fix-infra → affected validation', async () => {
  const originalFetch = globalThis.fetch;
  const { projectPath, cleanup } = withProjectEnv();
  globalThis.fetch = stubDraftOnlyLink();
  try {
    const result = await runSkill(doctorSkill, {
      model: makeDrillDownModel(projectPath, {
        'fix-infra': {
          summary: 'Gave republish instructions for perch-sec-hero-home',
          filesModified: [],
          changedStages: ['personalization-outcome'],
        },
        'ask-fixed': { working: true },
        're-present-runtime': finishedApplication,
        're-run-runtime': { choice: 'ready' },
        're-confirm-runtime': { choice: 'confirmed-end-to-end' },
        'validation-report': {
          profile: 'diagnostic-repair',
          finalState: 'validated-end-to-end',
          evidence: [],
          rerunStages: ['personalization-outcome'],
          summary: 'Validated end to end',
        },
      }),
    });

    assert.ok(result.path.includes('run-inspection'));
    assert.ok(result.path.includes('fix-infra'));
    assert.ok(result.path.includes('ask-fixed'));
    assert.ok(result.path.includes('validation-report'));
    // The whole point: a confirmed content fix is tried + verified BEFORE any code exploration.
    assert.ok(!result.path.includes('explore-code'));
  } finally {
    globalThis.fetch = originalFetch;
    cleanup();
  }
});

// Drill-down confirms a content problem, but the fix doesn't resolve it → fall through to code.
test('doctor: drill-down → fix-infra → ask-fixed (not working) → explore-code', async () => {
  const originalFetch = globalThis.fetch;
  const { projectPath, cleanup } = withProjectEnv();
  globalThis.fetch = stubDraftOnlyLink();
  try {
    const result = await runSkill(doctorSkill, {
      model: makeDrillDownModel(projectPath, {
        'fix-infra': { summary: 'Republished, but issue persists', filesModified: [] },
        'ask-fixed': { working: false },
        'explore-code': {
          explorationSummary: 'Provider looks fine',
          concerns: [],
          renderingBoundaries: ['components/BlockRenderer.tsx'],
        },
        review: { overallStatus: 'warn', recommendations: [], summary: 'Inconclusive.' },
        report: { choice: 'no' },
        done: { message: 'Ok' },
      }),
    });

    assert.ok(result.path.includes('fix-infra'));
    assert.ok(result.path.includes('ask-fixed'));
    assert.ok(result.path.includes('explore-code'));
    assert.ok(result.path.includes('review'));
  } finally {
    globalThis.fetch = originalFetch;
    cleanup();
  }
});

// Drill-down finds the entry HEALTHY → the problem is elsewhere, so go to code.
test('doctor: drill-down → run-inspection (pass) → explore-code', async () => {
  const originalFetch = globalThis.fetch;
  const { projectPath, cleanup } = withProjectEnv();
  // Same fully-resolved entry in CDA and CPA → inspectContent returns 'pass'.
  const healthy = {
    sys: { id: 'abc123', contentType: { sys: { id: 'hero' } } },
    fields: {
      title: 'Hero',
      nt_experiences: [
        {
          sys: { id: 'exp1', contentType: { sys: { id: 'nt_experience' } } },
          fields: {
            nt_variants: [{ sys: { id: 'v1', contentType: { sys: { id: 'hero' } } }, fields: { title: 'B' } }],
          },
        },
      ],
    },
  };
  globalThis.fetch = async (input: string | URL | Request) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    if (url.pathname.includes('/entries/abc123')) return entryResponse(healthy);
    if (url.hostname.includes('ninetailed.co')) return entryResponse({});
    return entryResponse({ items: [] });
  };
  try {
    const result = await runSkill(doctorSkill, {
      model: makeDrillDownModel(projectPath, {
        'choose-entry': { entryId: 'abc123', skip: false },
        'programmatic-gate': { choice: 'inspect-entry', problemDescription: 'One page is wrong' },
        'explore-code': {
          explorationSummary: 'Setup looks correct',
          concerns: [],
          renderingBoundaries: ['components/BlockRenderer.tsx'],
        },
        review: { overallStatus: 'warn', recommendations: [], summary: 'Entry healthy; check code.' },
        report: { choice: 'no' },
        done: { message: 'Ok' },
      }),
    });

    assert.ok(result.path.includes('run-inspection'));
    assert.ok(result.path.includes('explore-code'));
    assert.ok(!result.path.includes('fix-infra'));
    assert.ok(result.path.includes('review'));
  } finally {
    globalThis.fetch = originalFetch;
    cleanup();
  }
});

// --- resolveCredentials: secrets must not round-trip through the model ---

const REAL_CDA = 'KXNnMDByyIDpK409LDWDxA7KCKtW1YrxkoI00kBYl7I';
const REAL_PREVIEW = 'kuSQX62SWjquLPR-EGYIA96_mJtlzbYAJwaiutA3N94';

test('resolveCredentials: keeps scanned tokens when the agent echoes masked previews', () => {
  const resolved = resolveCredentials({
    scanned: {
      optimization: { clientId: 'client-uuid', environment: 'main' },
      contentful: { spaceId: 'ov5rm2sf4eyi', accessToken: REAL_CDA, previewToken: REAL_PREVIEW, environment: 'master' },
    },
    runCredentialChecks: true,
    // The agent misbehaves and echoes the masked previews from the table as "corrections".
    corrections: { contentful: { accessToken: 'KXNnMDBy****', previewToken: 'kuSQX62S****' } },
  });

  assert.equal(resolved.contentful.accessToken, REAL_CDA);
  assert.equal(resolved.contentful.previewToken, REAL_PREVIEW);
});

test('resolveCredentials: a real user correction overrides the scanned value', () => {
  const resolved = resolveCredentials({
    scanned: { contentful: { spaceId: 'old-space', accessToken: 'old-token', environment: 'master' } },
    runCredentialChecks: true,
    corrections: { contentful: { accessToken: 'a-genuinely-new-token-value' } },
  });

  assert.equal(resolved.contentful.accessToken, 'a-genuinely-new-token-value');
  assert.equal(resolved.contentful.spaceId, 'old-space');
});

test('resolveCredentials: runCredentialChecks=false yields empty credentials so checks skip', () => {
  const resolved = resolveCredentials({
    scanned: { optimization: { clientId: 'client-uuid' }, contentful: { spaceId: 'space', accessToken: REAL_CDA } },
    runCredentialChecks: false,
    corrections: undefined,
  });

  assert.equal(resolved.optimization.clientId, '');
  assert.equal(resolved.contentful.accessToken, '');
  assert.equal(resolved.contentful.spaceId, '');
});

test('resolveCredentials: applies sensible environment defaults', () => {
  const resolved = resolveCredentials({ scanned: {}, runCredentialChecks: true, corrections: undefined });
  assert.equal(resolved.personalization.environment, 'main');
  assert.equal(resolved.optimization.environment, 'main');
  assert.equal(resolved.contentful.environment, 'master');
  assert.equal(resolved.contentful.previewToken, undefined);
});

// User stops at the gate — programmatic findings are enough, no code review.
test('doctor: gate → done (findings are enough)', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      'detect-sdk': {
        framework: 'nextjs-app',
        frameworkVersion: '15.3.0',
        projectPath: '.',
      },
      'scan-credentials': {
        envVars: [{ name: 'OPTIMIZATION_CLIENT_ID', status: 'set', maskedValue: '3ad32994' }],
        optimization: { clientId: 'client-uuid', environment: 'main' },
      },
      'confirm-credentials': { runCredentialChecks: true },
      'programmatic-gate': { choice: 'done', problemDescription: '' },
      done: { message: 'Thanks' },
    }),
  });

  assert.ok(result.path.includes('programmatic-gate'));
  assert.ok(result.path.includes('done'));
  assert.ok(!result.path.includes('explore-code'));
  assert.ok(!result.path.includes('review'));
});

// --- Develop sub-skill tests ---

test('extend-existing analyze → plan → implement path', async () => {
  const projectPath = mkdtempSync(join(tmpdir(), 'contentful-personalization-extend-'));
  const originalFetch = globalThis.fetch;
  writeFileSync(
    join(projectPath, 'package.json'),
    JSON.stringify({
      dependencies: {
        '@ninetailed/experience.js': '^6.0.0',
        contentful: '^11.0.0',
        next: '^15.0.0',
      },
    }),
  );
  writeFileSync(
    join(projectPath, '.env.local'),
    ['NINETAILED_API_KEY=legacy-client', 'CONTENTFUL_SPACE_ID=space-id', 'CONTENTFUL_ACCESS_TOKEN=delivery-token'].join(
      '\n',
    ),
  );
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const result = await runSkill(extendExistingSkill, {
      params: { userQuery: 'Personalize the Hero component' },
      model: mockModel({
        analyze: {
          taskType: 'personalize-component',
          sdkInUse: 'ninetailed',
          targetSdk: 'ninetailed',
          workScope: 'existing-integration',
          optimizationRuntime: 'unknown',
          optimizationArchitecture: 'unknown',
          framework: 'nextjs-app',
          projectPath,
          mergeTagAuthoring: 'unknown',
          analyticsEvents: [],
          analyticsDestinations: [],
          renderingBoundaries: ['components/BlockRenderer.tsx', 'components/RichTextRenderer.tsx'],
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
        'verify-code': {
          status: 'pass',
          summary: 'Build and scoped wiring checks passed',
          checksRun: ['typecheck'],
          failures: [],
        },
        'review-credentials': { choice: 'continue' },
        'present-runtime': finishedApplication,
        'runtime-validation': { choice: 'ready' },
        'runtime-confirmation': { choice: 'confirmed-end-to-end' },
        report: {
          profile: 'component-extension',
          finalState: 'validated-end-to-end',
          evidence: [],
          rerunStages: [],
          summary: 'Validated end to end',
        },
      }),
    });

    assert.deepEqual(result.path, [
      'analyze',
      'capture-local-baseline',
      'plan',
      'implement',
      'verify-code',
      'validate-local',
      'review-credentials',
      'survey-content',
      'capture-live-events',
      'present-runtime',
      'runtime-validation',
      'runtime-confirmation',
      'report',
    ]);
    assert.deepEqual(result.response, {
      profile: 'component-extension',
      finalState: 'validated-end-to-end',
      evidence: [],
      rerunStages: [],
      summary: 'Validated end to end',
    });
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test('extend-existing maps task types to reusable validation profiles', () => {
  assert.equal(resolveDevelopmentValidationProfile('personalize-component'), 'component-extension');
  assert.equal(resolveDevelopmentValidationProfile('add-analytics'), 'analytics-extension');
  assert.equal(resolveDevelopmentValidationProfile('add-merge-tag', 'cms'), 'merge-tag-extension');
  assert.equal(resolveDevelopmentValidationProfile('add-merge-tag', 'code'), 'merge-tag-code-extension');
});

test('doctor reruns changed evidence and its downstream dependencies', () => {
  assert.deepEqual(resolveDoctorRerunStages(['cms-graph']), [
    'cms-graph',
    'runtime-transport',
    'personalization-outcome',
  ]);
  assert.deepEqual(resolveDoctorRerunStages(['local-integrity']), [
    'local-integrity',
    'credential-connectivity',
    'cms-graph',
    'runtime-transport',
    'personalization-outcome',
  ]);
});

test('extend-existing defaults new integrations to Optimization even if legacy is requested', () => {
  assert.equal(
    resolveDevelopmentSdk({
      sdkInUse: 'ninetailed',
      targetSdk: 'ninetailed',
      workScope: 'new-integration',
    }),
    'optimization',
  );
});

test('extend-existing can maintain the legacy side of a mixed-SDK repository', () => {
  assert.equal(
    resolveDevelopmentSdk({
      sdkInUse: 'both',
      targetSdk: 'ninetailed',
      workScope: 'existing-integration',
    }),
    'ninetailed',
  );
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

test('derivePackagesToInstall uses the React Native SDK and required quick-start peers', () => {
  assert.deepEqual(
    derivePackagesToInstall({
      sdkChoice: 'optimization',
      framework: 'react-native',
      architecture: 'client-only',
    }),
    ['@contentful/optimization-react-native', '@react-native-async-storage/async-storage', 'contentful'],
  );
});

test('derivePackagesToInstall rejects the legacy browser SDK for React Native', () => {
  assert.throws(
    () =>
      derivePackagesToInstall({
        sdkChoice: 'ninetailed',
        framework: 'react-native',
        architecture: 'client-only',
      }),
    /React Native onboarding requires/,
  );
});

test('new personalization setups always resolve to the recommended Optimization SDK', () => {
  assert.equal(
    resolveRecommendedSdkChoice({
      requestedChoice: 'ninetailed',
      framework: 'nextjs-pages',
      packages: { packages: { ninetailed: [], optimization: [] } },
      maintainsExistingLegacyDeployment: false,
    }),
    'optimization',
  );
});

test('existing legacy deployments can stay on Ninetailed for repair or extension', () => {
  assert.equal(
    resolveRecommendedSdkChoice({
      requestedChoice: 'ninetailed',
      framework: 'nextjs-pages',
      packages: { packages: { ninetailed: [{}], optimization: [] } },
      maintainsExistingLegacyDeployment: true,
    }),
    'ninetailed',
  );
});

test('unrelated new work defaults to Optimization even when legacy packages are installed', () => {
  assert.equal(
    resolveRecommendedSdkChoice({
      requestedChoice: 'ninetailed',
      framework: 'nextjs-app',
      packages: { packages: { ninetailed: [{}], optimization: [] } },
      maintainsExistingLegacyDeployment: false,
    }),
    'optimization',
  );
});

test('a mixed-SDK repository can still target its existing legacy deployment', () => {
  assert.equal(
    resolveRecommendedSdkChoice({
      requestedChoice: 'ninetailed',
      framework: 'nextjs-app',
      packages: { packages: { ninetailed: [{}], optimization: [{}] } },
      maintainsExistingLegacyDeployment: true,
    }),
    'ninetailed',
  );
});

test('optimization reference routing selects runtime-specific and hybrid references', () => {
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'nextjs-app', routerType: 'app' }), [
    'optimization-shared.md',
    'optimization-nextjs-app-router.md',
  ]);
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'nextjs-pages', routerType: 'pages' }), [
    'optimization-shared.md',
    'optimization-nextjs-pages-router.md',
  ]);
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'nextjs-hybrid', routerType: 'hybrid' }), [
    'optimization-shared.md',
    'optimization-nextjs-app-router.md',
    'optimization-nextjs-pages-router.md',
  ]);
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'remix', architecture: 'hybrid-ssr' }), [
    'optimization-shared.md',
    'optimization-react-web.md',
    'optimization-node.md',
  ]);
  assert.deepEqual(
    getOptimizationReferenceFiles({
      framework: 'remix',
      runtime: 'react-web',
      architecture: 'hybrid-ssr',
    }),
    ['optimization-shared.md', 'optimization-react-web.md', 'optimization-node.md'],
  );
  assert.deepEqual(
    getOptimizationReferenceFiles({
      framework: 'nextjs-hybrid',
      runtime: 'nextjs-app-router',
    }),
    ['optimization-shared.md', 'optimization-nextjs-app-router.md', 'optimization-nextjs-pages-router.md'],
  );
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'express', architecture: 'server-only' }), [
    'optimization-shared.md',
    'optimization-node.md',
  ]);
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'vanilla' }), [
    'optimization-shared.md',
    'optimization-web.md',
  ]);
  assert.deepEqual(getOptimizationReferenceFiles({ framework: 'react-native' }), [
    'optimization-shared.md',
    'optimization-react-native.md',
  ]);
});
