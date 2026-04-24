import { z } from '@contentful/skill-kit';

// --- Shared status types ---

export const CheckStatus = z.enum(['pass', 'warn', 'fail', 'skip', 'not_found']);
export type CheckStatus = z.infer<typeof CheckStatus>;

export const Finding = z.object({
  item: z.string(),
  status: CheckStatus,
  detail: z.string(),
});
export type Finding = z.infer<typeof Finding>;

export const ReadinessStatus = z.enum(['ready', 'minor-changes', 'needs-work', 'not-ready']);
export type ReadinessStatus = z.infer<typeof ReadinessStatus>;

// --- checkPackagesAndEnv action ---

export const PackageInfo = z.object({
  name: z.string(),
  version: z.string(),
});
export type PackageInfo = z.infer<typeof PackageInfo>;

export const EnvVarInfo = z.object({
  name: z.string(),
  status: z.enum(['set', 'empty', 'missing']),
  maskedValue: z.string().optional(),
});
export type EnvVarInfo = z.infer<typeof EnvVarInfo>;

export const PackagesAndEnvResult = z.object({
  packages: z.object({
    ninetailed: z.array(PackageInfo),
    optimization: z.array(PackageInfo),
    contentful: z.array(PackageInfo),
    framework: z.array(PackageInfo),
  }),
  envVars: z.array(EnvVarInfo),
  packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun', 'unknown']),
  apiKey: z.string().optional(),
  environment: z.string().optional(),
});
export type PackagesAndEnvResult = z.infer<typeof PackagesAndEnvResult>;

// --- checkApiConnectivity action ---

export const ApiCheckResult = z.object({
  status: CheckStatus,
  findings: z.array(Finding),
  reachable: z.boolean(),
  responseTimeMs: z.number().optional(),
  error: z.string().optional(),
});
export type ApiCheckResult = z.infer<typeof ApiCheckResult>;

// --- validateSetup action ---

export const ValidationResult = z.object({
  packages: PackagesAndEnvResult,
  api: ApiCheckResult,
  overallStatus: CheckStatus,
  summary: z.string(),
});
export type ValidationResult = z.infer<typeof ValidationResult>;

// --- installPackages action ---

export const InstallResult = z.object({
  installed: z.array(PackageInfo),
  failed: z.array(z.object({ name: z.string(), error: z.string() })),
  command: z.string(),
});
export type InstallResult = z.infer<typeof InstallResult>;

// --- writeEnvFile action ---

export const WriteEnvResult = z.object({
  written: z.array(z.object({ name: z.string(), value: z.string() })),
  skipped: z.array(z.object({ name: z.string(), reason: z.string() })),
  filePath: z.string(),
});
export type WriteEnvResult = z.infer<typeof WriteEnvResult>;

// --- Recommendation (used by doctor review step) ---

export const Recommendation = z.object({
  priority: z.enum(['critical', 'warning', 'info']),
  message: z.string(),
  category: z.string(),
});
export type Recommendation = z.infer<typeof Recommendation>;
