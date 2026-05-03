import { type } from '@contentful/skill-kit';

// --- Shared status types ---

export const CheckStatus = type("'pass' | 'warn' | 'fail' | 'skip' | 'not_found'");
export type CheckStatus = typeof CheckStatus.infer;

export const Finding = type({
  item: 'string',
  status: CheckStatus,
  detail: 'string',
});
export type Finding = typeof Finding.infer;

export const ReadinessStatus = type("'ready' | 'minor-changes' | 'needs-work' | 'not-ready'");
export type ReadinessStatus = typeof ReadinessStatus.infer;

// --- checkPackagesAndEnv action ---

export const PackageInfo = type({
  name: 'string',
  version: 'string',
});
export type PackageInfo = typeof PackageInfo.infer;

export const EnvVarInfo = type({
  name: 'string',
  status: "'set' | 'empty' | 'missing'",
  'maskedValue?': 'string',
});
export type EnvVarInfo = typeof EnvVarInfo.infer;

export const PackagesAndEnvResult = type({
  packages: {
    ninetailed: PackageInfo.array(),
    optimization: PackageInfo.array(),
    contentful: PackageInfo.array(),
    framework: PackageInfo.array(),
  },
  envVars: EnvVarInfo.array(),
  packageManager: "'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown'",
  'apiKey?': 'string',
  'environment?': 'string',
  'contentfulSpaceId?': 'string',
  'contentfulAccessToken?': 'string',
  'contentfulPreviewToken?': 'string',
  'contentfulEnvironment?': 'string',
});
export type PackagesAndEnvResult = typeof PackagesAndEnvResult.infer;

// --- checkApiConnectivity action ---

export const ApiCheckResult = type({
  status: CheckStatus,
  findings: Finding.array(),
  reachable: 'boolean',
  'responseTimeMs?': 'number',
  'error?': 'string',
});
export type ApiCheckResult = typeof ApiCheckResult.infer;

// --- validateSetup action ---

export const ValidationResult = type({
  packages: PackagesAndEnvResult,
  api: ApiCheckResult,
  overallStatus: CheckStatus,
  summary: 'string',
});
export type ValidationResult = typeof ValidationResult.infer;

// --- installPackages action ---

export const InstallResult = type({
  installed: PackageInfo.array(),
  failed: type({ name: 'string', error: 'string' }).array(),
  command: 'string',
});
export type InstallResult = typeof InstallResult.infer;

// --- writeEnvFile action ---

export const WriteEnvResult = type({
  written: type({ name: 'string', value: 'string' }).array(),
  skipped: type({ name: 'string', reason: 'string' }).array(),
  filePath: 'string',
});
export type WriteEnvResult = typeof WriteEnvResult.infer;

// --- Recommendation (used by doctor review step) ---

export const Recommendation = type({
  priority: "'critical' | 'warning' | 'info'",
  message: 'string',
  category: 'string',
});
export type Recommendation = typeof Recommendation.infer;

// --- inspectContent action ---

const EntryApiState = type({
  found: 'boolean',
  hasNtExperiences: 'boolean',
  ntExperiencesCount: 'number',
  experiencesResolved: 'boolean',
  variantsResolved: 'boolean',
});

export const ContentInspectionResult = type({
  status: CheckStatus,
  findings: Finding.array(),
  entry: {
    id: 'string',
    'contentTypeId?': 'string',
    'cda?': EntryApiState,
    'cpa?': EntryApiState,
    'comparison?': {
      hasUnpublishedChanges: 'boolean',
      detail: 'string',
    },
  },
  'error?': 'string',
});
export type ContentInspectionResult = typeof ContentInspectionResult.infer;
