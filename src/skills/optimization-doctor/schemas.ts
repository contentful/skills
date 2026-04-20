import { z } from '@contentful/skill-kit';

export const CheckStatus = z.enum(['pass', 'warn', 'fail', 'skip', 'not_found']);
export type CheckStatus = z.infer<typeof CheckStatus>;

export const Finding = z.object({
  item: z.string(),
  status: CheckStatus,
  detail: z.string(),
});
export type Finding = z.infer<typeof Finding>;

export const CheckResult = z.object({
  status: CheckStatus,
  findings: z.array(Finding),
});
export type CheckResult = z.infer<typeof CheckResult>;

export const EnvCheckResult = CheckResult.extend({
  apiKey: z.string().optional(),
  environment: z.string().optional(),
});
export type EnvCheckResult = z.infer<typeof EnvCheckResult>;

export const PackageCheckResult = CheckResult.extend({
  mainVersion: z.string().optional(),
  installedPackages: z.array(z.string()),
});
export type PackageCheckResult = z.infer<typeof PackageCheckResult>;

export const ProviderCheckResult = CheckResult.extend({
  location: z.string().optional(),
  hasAnalyticsPlugin: z.boolean(),
});
export type ProviderCheckResult = z.infer<typeof ProviderCheckResult>;

export const MiddlewareCheckResult = CheckResult.extend({
  path: z.string().optional(),
  matcherPatterns: z.array(z.string()),
});
export type MiddlewareCheckResult = z.infer<typeof MiddlewareCheckResult>;

export const ComponentCheckResult = CheckResult.extend({
  files: z.array(z.string()),
  hasComponentMapper: z.boolean(),
});
export type ComponentCheckResult = z.infer<typeof ComponentCheckResult>;

export const AnalyticsCheckResult = CheckResult.extend({
  pluginConfigured: z.boolean(),
  eventsFound: z.array(z.string()),
});
export type AnalyticsCheckResult = z.infer<typeof AnalyticsCheckResult>;

export const ScanResult = z.object({
  env: EnvCheckResult,
  packages: PackageCheckResult,
  provider: ProviderCheckResult,
  middleware: MiddlewareCheckResult,
  components: ComponentCheckResult,
  analytics: AnalyticsCheckResult,
});
export type ScanResult = z.infer<typeof ScanResult>;

export const ApiCheckResult = z.object({
  status: CheckStatus,
  findings: z.array(Finding),
  reachable: z.boolean(),
  responseTimeMs: z.number().optional(),
  error: z.string().optional(),
});
export type ApiCheckResult = z.infer<typeof ApiCheckResult>;

export const Recommendation = z.object({
  priority: z.enum(['critical', 'warning', 'info']),
  message: z.string(),
  check: z.string(),
});
export type Recommendation = z.infer<typeof Recommendation>;
