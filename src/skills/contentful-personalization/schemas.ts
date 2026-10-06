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

// Validation is deliberately expressed as evidence rather than one overall boolean.
// Each workflow gathers the stages that fit its task and the shared policy below turns
// those observations into a consistent final state.
export const ValidationStage = type(
  "'local-integrity' | 'credential-connectivity' | 'cms-graph' | 'runtime-transport' | 'personalization-outcome'",
);
export type ValidationStage = typeof ValidationStage.infer;

export const ValidationEvidenceStatus = type(
  "'pass' | 'warn' | 'fail' | 'unavailable' | 'deferred' | 'blocked' | 'not-applicable'",
);
export type ValidationEvidenceStatus = typeof ValidationEvidenceStatus.infer;

export const ValidationEvidenceSource = type(
  "'local-analysis' | 'synthetic-probe' | 'contentful-api' | 'analytics-api' | 'browser' | 'manual-confirmation'",
);
export type ValidationEvidenceSource = typeof ValidationEvidenceSource.infer;

export const ValidationRequirement = type("'required' | 'recommended' | 'not-applicable'");
export type ValidationRequirement = typeof ValidationRequirement.infer;

export const ValidationProfile = type(
  "'full-setup' | 'component-extension' | 'analytics-extension' | 'experiment-authoring' | 'merge-tag-extension' | 'merge-tag-code-extension' | 'diagnostic-repair'",
);
export type ValidationProfile = typeof ValidationProfile.infer;

export const ValidationFinalState = type(
  "'validated-end-to-end' | 'implementation-complete-validation-deferred' | 'implementation-complete-live-validation-pending' | 'blocked-by-cms-authoring-or-publishing' | 'blocked-by-validation-constraints' | 'validation-failed'",
);
export type ValidationFinalState = typeof ValidationFinalState.infer;

export const ValidationStageEvidence = type({
  stage: ValidationStage,
  status: ValidationEvidenceStatus,
  source: ValidationEvidenceSource,
  summary: 'string',
  findings: Finding.array(),
  'synthetic?': 'boolean',
});
export type ValidationStageEvidence = typeof ValidationStageEvidence.infer;

export const ValidationSummary = type({
  profile: ValidationProfile,
  finalState: ValidationFinalState,
  evidence: ValidationStageEvidence.array(),
  rerunStages: ValidationStage.array(),
  summary: 'string',
});
export type ValidationSummary = typeof ValidationSummary.infer;

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
  'source?': 'string',
  'warning?': 'string',
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
    // Personal Access Token (CFPAT) — used only for GET-only automated Live Events
    // validation through /optimization-doctor. Not used for CDA/CPA content queries.
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

// --- validateLocalSetup action ---

export const LocalValidationResult = type({
  packages: PackagesResult,
  credentials: CredentialsScanResult,
  status: CheckStatus,
  findings: Finding.array(),
  summary: 'string',
});
export type LocalValidationResult = typeof LocalValidationResult.infer;

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

// --- finished application presentation ---

export const RuntimePresentationResult = type({
  applicationUrl: 'string',
  serverStatus: "'reused' | 'started' | 'user-required' | 'unavailable'",
  browserStatus: "'opened-visible' | 'opened-headless' | 'user-required' | 'unavailable'",
  liveEventsStatus: "'opened-visible' | 'opened-headless' | 'user-required' | 'not-applicable' | 'unavailable'",
  summary: 'string',
  checks: 'string[]',
  issues: 'string[]',
});
export type RuntimePresentationResult = typeof RuntimePresentationResult.infer;

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

export const ControlledValidationAction = type("'accept-consent' | 'reload' | 'query-navigation' | 'interaction'");
export type ControlledValidationAction = typeof ControlledValidationAction.infer;

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
  'controlledValidationSuggested?': 'boolean',
  'controlledActions?': ControlledValidationAction.array(),
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
  publishedAudienceCount: 'number',
  previewAudienceCount: 'number',
  publishedMergeTagCount: 'number',
  previewMergeTagCount: 'number',
  publishedMergeTagIdentifiers: 'string[]',
  previewMergeTagIdentifiers: 'string[]',
  testScenario: {
    kind: "'all-visitors' | 'existing-targeted' | 'preview-only' | 'fixture-needed' | 'unavailable'",
    summary: 'string',
    'experienceEntryId?': 'string',
    'experienceId?': 'string',
    'experienceName?': 'string',
    'audienceEntryId?': 'string',
    'audienceId?': 'string',
    'audienceName?': 'string',
    variantEntryIds: 'string[]',
  },
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
export type OptimizationDoctorLiveEventsLast15m = typeof OptimizationDoctorLiveEventsLast15m.infer;

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

export const OptimizationDoctorRequestContext = type({
  endpoint: 'string',
  spaceId: 'string',
  environmentId: 'string',
  managementToken: {
    status: "'used' | 'missing'",
    variable: "'CONTENTFUL_MANAGEMENT_TOKEN'",
    'maskedValue?': 'string',
    'source?': 'string',
  },
});
export type OptimizationDoctorRequestContext = typeof OptimizationDoctorRequestContext.infer;

export const OptimizationDoctorCheckResult = type({
  status: CheckStatus,
  findings: Finding.array(),
  request: OptimizationDoctorRequestContext,
  'liveEvents?': OptimizationDoctorLiveEventsLast15m,
  'error?': 'string',
});
export type OptimizationDoctorCheckResult = typeof OptimizationDoctorCheckResult.infer;
