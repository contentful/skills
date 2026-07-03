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

// Which personalization SDK family a project uses, derived from installed packages.
// 'legacy' = @ninetailed/experience.js, 'modern' = @contentful/optimization.
export const SdkFamily = type("'legacy' | 'modern' | 'both' | 'none'");
export type SdkFamily = typeof SdkFamily.infer;

// --- Shared field types ---

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

// --- checkPackages action ---

export const PackagesResult = type({
  packages: {
    ninetailed: PackageInfo.array(),
    optimization: PackageInfo.array(),
    contentful: PackageInfo.array(),
    framework: PackageInfo.array(),
  },
  packageManager: "'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown'",
});
export type PackagesResult = typeof PackagesResult.infer;

// --- scanCredentials action ---

export const CredentialsScanResult = type({
  envVars: EnvVarInfo.array(),
  // Legacy @ninetailed/experience.js credentials (NINETAILED_API_KEY / _ENVIRONMENT).
  'personalization?': {
    'apiKey?': 'string',
    'environment?': 'string',
  },
  // Modern @contentful/optimization credentials (OPTIMIZATION_CLIENT_ID / _ENVIRONMENT).
  'optimization?': {
    'clientId?': 'string',
    'environment?': 'string',
  },
  'contentful?': {
    'spaceId?': 'string',
    'accessToken?': 'string',
    'previewToken?': 'string',
    // Personal Access Token (CFPAT) — used only by the /optimization-doctor
    // live-events check. Not used for CDA/CPA content queries.
    'managementToken?': 'string',
    'environment?': 'string',
  },
});
export type CredentialsScanResult = typeof CredentialsScanResult.infer;

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
  packages: PackagesResult,
  credentials: CredentialsScanResult,
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

// --- live-debug runtime inspection ---

export const RuntimeRequestSummary = type({
  url: 'string',
  method: 'string',
  status: 'number',
  summary: 'string',
});
export type RuntimeRequestSummary = typeof RuntimeRequestSummary.infer;

export const RuntimeCheckResult = type({
  url: 'string',
  overallStatus: "'pass' | 'warn' | 'fail'",
  summary: 'string',
  consoleSummary: 'string',
  requestCount: 'number',
  requests: RuntimeRequestSummary.array(),
  findings: Finding.array(),
  recommendations: Recommendation.array(),
  shouldRunDoctor: 'boolean',
});
export type RuntimeCheckResult = typeof RuntimeCheckResult.infer;

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

// --- surveyContent action ---
//
// Account-wide survey of personalization content state. Unlike inspectContent
// (which deep-inspects one entry by ID), this queries nt_experience entries
// across CDA + CPA without needing an entry ID, so it can run as an automatic
// up-front gate. It flags suspicious entries for optional drill-down.

export const ContentSurveyResult = type({
  status: CheckStatus,
  findings: Finding.array(),
  // Published (CDA) vs preview (CPA) experience counts.
  publishedExperienceCount: 'number',
  previewExperienceCount: 'number',
  // Entry IDs worth a deeper inspectContent pass (e.g. unpublished experiences).
  suspiciousEntryIds: 'string[]',
  'error?': 'string',
});
export type ContentSurveyResult = typeof ContentSurveyResult.infer;

// --- checkOptimizationDoctor action ---
//
// Calls the analytics-api /optimization-doctor endpoint with a CFPAT to fetch
// per-event-type counts observed in the last 15 minutes. 
// Useful to verify that events are reaching the destination.

export const OptimizationDoctorLiveEventsLast15m = type({
  numTrackEvents: 'number',
  numComponentEvents: 'number',
  numIdentifyEvents: 'number',
  numPageEvents: 'number',
});
export type OptimizationDoctorLiveEventsLast15m =
  typeof OptimizationDoctorLiveEventsLast15m.infer;

export const OptimizationDoctorResponse = type({
  data: {
    diagnostics: {
      liveEvents: {
        last15m: OptimizationDoctorLiveEventsLast15m,
      },
    },
  },
});
export type OptimizationDoctorResponse = typeof OptimizationDoctorResponse.infer;

export const OptimizationDoctorCheckResult = type({
  status: CheckStatus,
  findings: Finding.array(),
  'liveEvents?': OptimizationDoctorLiveEventsLast15m,
  'error?': 'string',
});
export type OptimizationDoctorCheckResult =
  typeof OptimizationDoctorCheckResult.infer;
