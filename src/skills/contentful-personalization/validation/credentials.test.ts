import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOptimizationDoctorRequestContext,
  credentialScansDiffer,
  detectedCredentialRows,
  optimizationDoctorRequestRows,
} from './credentials.js';

test('credential drift compares exact selected values and sources without exposing them', () => {
  const initial = {
    envVars: [
      {
        name: 'CONTENTFUL_MANAGEMENT_TOKEN',
        status: 'set' as const,
        maskedValue: 'cfpat_sa****',
        source: '/project/.env.local',
      },
    ],
    contentful: { managementToken: 'cfpat_same-prefix-one' },
  };

  assert.equal(credentialScansDiffer(initial, structuredClone(initial)), false);
  assert.equal(
    credentialScansDiffer(initial, {
      ...structuredClone(initial),
      contentful: { managementToken: 'cfpat_same-prefix-two' },
    }),
    true,
  );
  assert.equal(
    credentialScansDiffer(initial, {
      ...structuredClone(initial),
      envVars: [{ ...initial.envVars[0], source: 'process environment' }],
    }),
    true,
  );
});

test('detected credential rows expose masked values and their selected sources', () => {
  const rows = detectedCredentialRows({
    envVars: [
      {
        name: 'CONTENTFUL_SPACE_ID',
        status: 'set',
        maskedValue: 'space1',
        source: '/project/.env',
      },
      {
        name: 'CONTENTFUL_MANAGEMENT_TOKEN',
        status: 'set',
        maskedValue: 'cfpat_ab****',
        source: 'process environment',
      },
      { name: 'CONTENTFUL_PREVIEW_TOKEN', status: 'missing' },
    ],
    contentful: {
      spaceId: 'space1',
      managementToken: 'cfpat_absolutely-secret',
    },
  });

  assert.deepEqual(rows, [
    {
      Credential: 'Contentful space ID',
      Variable: 'CONTENTFUL_SPACE_ID',
      Value: 'space1',
      Source: '/project/.env',
    },
    {
      Credential: 'CMA token / CFPAT',
      Variable: 'CONTENTFUL_MANAGEMENT_TOKEN',
      Value: 'cfpat_ab****',
      Source: 'process environment',
    },
  ]);
  assert.ok(!JSON.stringify(rows).includes('absolutely-secret'));
});

test('optimization doctor request evidence identifies the exact masked token and target', () => {
  const request = createOptimizationDoctorRequestContext({
    spaceId: 'space1',
    environmentId: 'master',
    managementToken: 'cfpat_secret',
    managementTokenSource: '/project/.env.local',
  });
  const rows = optimizationDoctorRequestRows({ request });

  assert.ok(rows.some((row) => row.Field === 'CONTENTFUL_MANAGEMENT_TOKEN' && row.Value === 'cfpat_se****'));
  assert.ok(rows.some((row) => row.Field === 'Credential source' && row.Value === '/project/.env.local'));
  assert.ok(rows.some((row) => row.Field === 'Space' && row.Value === 'space1'));
  assert.ok(rows.some((row) => row.Field === 'Environment' && row.Value === 'master'));
  assert.ok(!JSON.stringify(rows).includes('cfpat_secret'));
});
