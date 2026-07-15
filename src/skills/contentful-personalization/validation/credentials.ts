import { act, prompt, render, type, view } from '@contentful/skill-kit';
import type {
  CredentialsScanResult,
  OptimizationDoctorCheckResult,
  OptimizationDoctorRequestContext,
} from '../schemas.js';

export const MANAGEMENT_TOKEN_VARIABLE = 'CONTENTFUL_MANAGEMENT_TOKEN';

const CREDENTIAL_LABELS: Record<string, string> = {
  NINETAILED_API_KEY: 'Ninetailed API key (legacy SDK)',
  NINETAILED_ENVIRONMENT: 'Ninetailed environment',
  OPTIMIZATION_CLIENT_ID: 'Optimization client ID',
  OPTIMIZATION_ENVIRONMENT: 'Optimization environment',
  CONTENTFUL_SPACE_ID: 'Contentful space ID',
  CONTENTFUL_ACCESS_TOKEN: 'CDA token',
  CONTENTFUL_PREVIEW_TOKEN: 'CPA token',
  CONTENTFUL_MANAGEMENT_TOKEN: 'CMA token / CFPAT',
  CONTENTFUL_ENVIRONMENT: 'Contentful environment',
};

export type DetectedCredentialRow = Record<string, string> & {
  Credential: string;
  Variable: string;
  Value: string;
  Source: string;
};

export type OptimizationDoctorRequestRow = Record<string, string> & {
  Field: string;
  Value: string;
};

export const CredentialReviewResponse = type({ choice: "'continue' | 'rescan' | 'manual-only'" });

export function maskCredential(value: string): string {
  if (value.length <= 8) return '****';
  return `${value.slice(0, 8)}****`;
}

export function detectedCredentialRows(credentials?: CredentialsScanResult): DetectedCredentialRow[] {
  return (credentials?.envVars ?? [])
    .filter((variable) => variable.status === 'set')
    .map((variable) => ({
      Credential: CREDENTIAL_LABELS[variable.name] ?? variable.name,
      Variable: variable.name,
      Value: variable.maskedValue ?? '—',
      Source: variable.source ?? 'unknown',
    }));
}

export function credentialReviewPrompt(credentials?: CredentialsScanResult) {
  const rows = detectedCredentialRows(credentials);
  return [
    prompt`
      Present the detected credential table exactly as rendered. Explain that secret values are
      masked, the source is where the scanner selected each value, and this checkpoint identifies
      what the upcoming automated validation will use. Do not claim that detection proves a
      credential is valid.
    `,
    view(
      '🔑 Detected credentials for validation',
      rows.length > 0
        ? render.table(rows, { columns: ['Credential', 'Variable', 'Value', 'Source'] })
        : '*No credentials were detected. Automated API checks will be unavailable.*',
    ),
    act.askUser({
      type: 'structured',
      question: 'How should validation continue?',
      options: [
        {
          value: 'continue',
          label: '✅ Use these credentials',
          description: 'Run the GET-only Contentful checks and credential connectivity checks with these values',
        },
        {
          value: 'rescan',
          label: '🔄 I corrected the environment',
          description: 'Scan again before any automated API validation',
        },
        {
          value: 'manual-only',
          label: '⏭️ Skip automated API checks',
          description: 'Continue to manual runtime validation without using the detected credentials',
        },
      ],
    }),
  ];
}

export function managementTokenSource(credentials?: CredentialsScanResult): string | undefined {
  return credentials?.envVars.find(
    (variable) => variable.name === MANAGEMENT_TOKEN_VARIABLE && variable.status === 'set',
  )?.source;
}

export function createOptimizationDoctorRequestContext(input: {
  spaceId: string;
  environmentId: string;
  managementToken?: string;
  managementTokenSource?: string;
}): OptimizationDoctorRequestContext {
  const endpoint = `https://analytics.ninetailed.co/v1/spaces/${input.spaceId}/environments/${input.environmentId}/optimization-doctor`;
  return {
    endpoint,
    spaceId: input.spaceId,
    environmentId: input.environmentId,
    managementToken: input.managementToken
      ? {
          status: 'used',
          variable: MANAGEMENT_TOKEN_VARIABLE,
          maskedValue: maskCredential(input.managementToken),
          ...(input.managementTokenSource ? { source: input.managementTokenSource } : {}),
        }
      : {
          status: 'missing',
          variable: MANAGEMENT_TOKEN_VARIABLE,
        },
  };
}

export function optimizationDoctorRequestRows(
  result?: Pick<OptimizationDoctorCheckResult, 'request'>,
): OptimizationDoctorRequestRow[] {
  if (!result?.request) return [];
  const request = result.request;
  return [
    { Field: 'Endpoint', Value: request.endpoint },
    { Field: 'Space', Value: request.spaceId || 'missing' },
    { Field: 'Environment', Value: request.environmentId || 'missing' },
    {
      Field: request.managementToken.variable,
      Value: request.managementToken.maskedValue ?? 'not available',
    },
    { Field: 'Credential source', Value: request.managementToken.source ?? 'unknown' },
  ];
}
