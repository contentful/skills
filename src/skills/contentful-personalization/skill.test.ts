import test from 'node:test';
import assert from 'node:assert/strict';
import { runComposite, runSkill, mockModel } from '@contentful/skill-kit/test';
import skill from './skill.js';
import doctorSkill from './subskills/doctor.js';
import developSkill from './subskills/develop.js';

// --- Dispatcher routing tests ---

test('classify routes to onboard for setup requests', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: { intent: 'onboard', confidence: 0.95, reasoning: 'User wants to set up personalization' },
      'onboard/explore': {
        framework: 'nextjs-app', routerType: 'app', projectPath: '.', frameworkVersion: '14.0.0',
        explorationSummary: 'Next.js project', personalizableCandidates: [], existingSetup: 'none',
        readinessOnly: true,
      },
      'onboard/assess': { readinessStatus: 'ready', report: 'All good', prerequisites: [], readinessOnly: true },
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
      classify: { intent: 'doctor', confidence: 0.9, reasoning: 'User says personalization is broken' },
      'doctor/explore': {
        framework: 'nextjs-app', projectPath: '.', explorationSummary: 'Broken setup', concerns: ['No provider'],
      },
      'doctor/check-api': { shouldCheck: false, environment: 'main' },
      'doctor/triage': { choice: 'skip', hasAutoTokens: false, problemDescription: 'Not working' },
      'doctor/review': { overallStatus: 'fail', recommendations: [], summary: 'Needs fixes' },
      'doctor/report': { choice: 'no' },
      'doctor/report-only': { message: 'Ok' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'doctor');
});

test('classify routes to develop for component tasks', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: { intent: 'develop', confidence: 0.85, reasoning: 'User wants to personalize a component' },
      'develop/analyze': {
        taskType: 'personalize-component', sdkInUse: 'ninetailed', framework: 'nextjs-app',
        targetFiles: ['Hero.tsx'], analysis: 'Wrap Hero',
      },
      'develop/plan': { approved: true, plan: 'Add Experience wrapper', filesToModify: ['Hero.tsx'] },
      'develop/implement': { filesModified: ['Hero.tsx'], summary: 'Done' },
    }),
  });

  assert.equal(result.redirectedTo?.kind, 'subskill');
  assert.equal(result.redirectedTo?.name, 'develop');
});

test('classify routes to topic for reference questions', async () => {
  const result = await runComposite(skill, {
    model: mockModel({
      classify: { intent: 'reference', confidence: 0.9, topic: 'sdk-selection', reasoning: 'User asks which SDK to use' },
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
        framework: 'nextjs-app', projectPath: '.', explorationSummary: 'Broken', concerns: [],
      },
      'doctor/check-api': { shouldCheck: false, environment: 'main' },
      'doctor/triage': { choice: 'skip', hasAutoTokens: false, problemDescription: 'Unclear issue' },
      'doctor/review': { overallStatus: 'warn', recommendations: [], summary: 'Issues found' },
      'doctor/report': { choice: 'no' },
      'doctor/report-only': { message: 'Ok' },
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

// --- Doctor sub-skill tests ---

test('doctor explore → check-api → triage (skip) → review → report path', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Next.js 14 App Router project with partial Ninetailed setup',
        concerns: ['Provider not found', 'Missing middleware'],
      },
      'check-api': { apiKey: 'nt_prod_test123', environment: 'main', shouldCheck: true },
      triage: { choice: 'skip', hasAutoTokens: false, problemDescription: 'Variants not showing' },
      review: {
        overallStatus: 'warn',
        recommendations: [
          { priority: 'warning', message: 'Provider not found in source', category: 'provider' },
        ],
        summary: 'Partial setup detected.',
      },
      report: { choice: 'no' },
      'report-only': { message: 'Good luck!' },
    }),
  });

  assert.ok(result.path.includes('explore'));
  assert.ok(result.path.includes('check-api'));
  assert.ok(result.path.includes('triage'));
  assert.ok(result.path.includes('review'));
  assert.ok(result.path.includes('report'));
});

test('doctor triage → collect-credentials → get-entry-id → run-inspection → review (content inspection)', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Setup looks correct',
        concerns: [],
      },
      'check-api': { shouldCheck: false, environment: 'main' },
      triage: { choice: 'inspect-entry', hasAutoTokens: false, problemDescription: 'Variants not showing on production' },
      'collect-credentials': { hasCredentials: true, spaceId: 'space1', accessToken: 'token1' },
      'get-entry-id': { entryId: 'abc123' },
      'run-inspection': { confirmed: true },
      review: {
        overallStatus: 'fail',
        recommendations: [
          { priority: 'critical', message: 'Entry has unpublished changes — republish the baseline entry', category: 'content' },
        ],
        summary: 'Unpublished changes detected.',
      },
      report: { choice: 'no' },
      'report-only': { message: 'Ok' },
    }),
  });

  assert.ok(result.path.includes('triage'));
  assert.ok(result.path.includes('collect-credentials'));
  assert.ok(result.path.includes('get-entry-id'));
  assert.ok(result.path.includes('run-inspection'));
  assert.ok(result.path.includes('review'));
});

test('doctor triage → help-find-entry → review (user skips entry search)', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Setup looks correct',
        concerns: [],
      },
      'check-api': { shouldCheck: false, environment: 'main' },
      triage: { choice: 'need-help-finding', hasAutoTokens: false, problemDescription: 'Not sure what is wrong' },
      'help-find-entry': { skip: true, hasAutoTokens: false },
      review: {
        overallStatus: 'pass',
        recommendations: [],
        summary: 'Everything looks good from code side.',
      },
      report: { choice: 'no' },
      'report-only': { message: 'All clear' },
    }),
  });

  assert.ok(result.path.includes('triage'));
  assert.ok(result.path.includes('help-find-entry'));
  assert.ok(result.path.includes('review'));
});

test('doctor triage → collect-credentials → review (user cannot provide tokens)', async () => {
  const result = await runSkill(doctorSkill, {
    model: mockModel({
      explore: {
        framework: 'nextjs-app',
        frameworkVersion: '14.1.0',
        projectPath: '.',
        explorationSummary: 'Setup looks correct',
        concerns: [],
      },
      'check-api': { shouldCheck: false, environment: 'main' },
      triage: { choice: 'inspect-entry', hasAutoTokens: false, problemDescription: 'Variants not showing' },
      'collect-credentials': { hasCredentials: false },
      review: {
        overallStatus: 'pass',
        recommendations: [],
        summary: 'Code looks fine, could not inspect content.',
      },
      report: { choice: 'no' },
      'report-only': { message: 'Ok' },
    }),
  });

  assert.ok(result.path.includes('triage'));
  assert.ok(result.path.includes('collect-credentials'));
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
