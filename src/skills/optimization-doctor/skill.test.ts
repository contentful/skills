import test from 'node:test';
import assert from 'node:assert/strict';
import { runSkill, mockModel } from '@contentful/skill-kit/test';
import skill from './skill.js';

test('all checks pass, no deep search needed', async () => {
  const result = await runSkill(skill, {
    model: mockModel({
      diagnose: { framework: 'nextjs-app', frameworkVersion: '14.1.0', projectPath: '.' },
      scan: { projectPath: '.', framework: 'nextjs-app' },
      triage: { needsDeepSearch: false, checksToSearch: [] },
      'check-api': { apiKey: 'nt_prod_test123', environment: 'main', shouldCheck: true },
      review: {
        overallStatus: 'pass',
        recommendations: [],
        summary: 'All checks passed.',
      },
      report: { report: 'rendered report' },
    }),
  });

  assert.deepEqual(result.path, ['diagnose', 'scan', 'triage', 'check-api', 'review', 'report']);
});

test('scan finds gaps, deep search triggered', async () => {
  const result = await runSkill(skill, {
    model: mockModel({
      diagnose: { framework: 'nextjs-app', projectPath: '.' },
      scan: { projectPath: '.', framework: 'nextjs-app' },
      triage: { needsDeepSearch: true, checksToSearch: ['provider configuration', 'experience components'] },
      'deep-search': {
        provider: { found: true, location: 'lib/providers.tsx', detail: 'Custom PersonalizationProvider wrapping NinetailedProvider' },
        components: { found: true, files: ['src/PersonalizedHero.tsx'], detail: 'Custom wrapper around Experience' },
      },
      'check-api': { apiKey: 'nt_prod_test123', environment: 'main', shouldCheck: true },
      review: {
        overallStatus: 'pass',
        recommendations: [
          { priority: 'info', message: 'Consider using standard naming for provider wrapper', check: 'provider' },
        ],
        summary: 'Setup is functional with custom wrappers.',
      },
      report: { report: 'rendered report' },
    }),
  });

  assert.ok(result.path.includes('deep-search'));
  assert.deepEqual(result.path, ['diagnose', 'scan', 'triage', 'deep-search', 'check-api', 'review', 'report']);
});

test('missing env vars, API check skipped', async () => {
  const result = await runSkill(skill, {
    model: mockModel({
      diagnose: { framework: 'nextjs-pages', projectPath: '.' },
      scan: { projectPath: '.', framework: 'nextjs-pages' },
      triage: { needsDeepSearch: false, checksToSearch: [] },
      'check-api': { environment: 'main', shouldCheck: false },
      review: {
        overallStatus: 'fail',
        recommendations: [
          { priority: 'critical', message: 'Add NINETAILED_API_KEY to .env file', check: 'env' },
          { priority: 'critical', message: 'Add CONTENTFUL_SPACE_ID to .env file', check: 'env' },
        ],
        summary: 'Missing critical environment variables.',
      },
      report: { report: 'rendered report' },
    }),
  });

  assert.deepEqual(result.path, ['diagnose', 'scan', 'triage', 'check-api', 'review', 'report']);
});

test('non-nextjs framework, middleware check skipped', async () => {
  const result = await runSkill(skill, {
    model: mockModel({
      diagnose: { framework: 'gatsby', frameworkVersion: '5.0.0', projectPath: '.' },
      scan: { projectPath: '.', framework: 'gatsby' },
      triage: { needsDeepSearch: false, checksToSearch: [] },
      'check-api': { apiKey: 'nt_prod_test123', environment: 'main', shouldCheck: true },
      review: {
        overallStatus: 'pass',
        recommendations: [],
        summary: 'Gatsby project looks good.',
      },
      report: { report: 'rendered report' },
    }),
  });

  assert.deepEqual(result.path, ['diagnose', 'scan', 'triage', 'check-api', 'review', 'report']);
});

test('API key invalid, auth failure reported', async () => {
  const result = await runSkill(skill, {
    model: mockModel({
      diagnose: { framework: 'nextjs-app', projectPath: '.' },
      scan: { projectPath: '.', framework: 'nextjs-app' },
      triage: { needsDeepSearch: false, checksToSearch: [] },
      'check-api': { apiKey: 'nt_prod_invalid', environment: 'main', shouldCheck: true },
      review: {
        overallStatus: 'warn',
        recommendations: [
          { priority: 'critical', message: 'API key was rejected. Verify NINETAILED_API_KEY is correct.', check: 'api' },
        ],
        summary: 'API key issue detected.',
      },
      report: { report: 'rendered report' },
    }),
  });

  assert.deepEqual(result.path, ['diagnose', 'scan', 'triage', 'check-api', 'review', 'report']);
});
