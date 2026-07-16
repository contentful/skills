import type {
  ApiCheckResult,
  ContentSurveyResult,
  LocalValidationResult,
  OptimizationDoctorCheckResult,
  OptimizationDoctorLiveEventsLast15m,
  RuntimeCheckResult,
  ValidationStageEvidence,
  ValidationProfile,
} from '../schemas.js';
import { getValidationStages } from './policy.js';

export type LiveEventsDeltaRow = Record<string, string> & {
  Event: string;
  Baseline: string;
  Current: string;
  Delta: string;
};

export function liveEventsDeltaRows(
  before?: OptimizationDoctorLiveEventsLast15m,
  after?: OptimizationDoctorLiveEventsLast15m,
): LiveEventsDeltaRow[] {
  return [
    ['Page', before?.numPageEvents ?? 0, after?.numPageEvents ?? 0],
    ['Component', before?.numComponentEvents ?? 0, after?.numComponentEvents ?? 0],
    ['Track', before?.numTrackEvents ?? 0, after?.numTrackEvents ?? 0],
    ['Identify', before?.numIdentifyEvents ?? 0, after?.numIdentifyEvents ?? 0],
  ].map(([event, baseline, current]) => {
    const hasBaseline = before !== undefined;
    const hasCurrent = after !== undefined;
    return {
      Event: String(event),
      Baseline: hasBaseline ? String(baseline) : 'unavailable',
      Current: hasCurrent ? String(current) : 'unavailable',
      Delta: hasBaseline && hasCurrent ? String(Number(current) - Number(baseline)) : 'unavailable',
    };
  });
}

export function localSetupEvidence(result: LocalValidationResult): ValidationStageEvidence {
  return {
    stage: 'local-integrity',
    status: result.status === 'pass' ? 'pass' : 'fail',
    source: 'local-analysis',
    summary: result.summary,
    findings: result.findings,
  };
}

export function connectivityEvidence(result: ApiCheckResult): ValidationStageEvidence {
  return {
    stage: 'credential-connectivity',
    status: result.status === 'pass' ? 'pass' : result.status === 'skip' ? 'unavailable' : 'fail',
    source: 'synthetic-probe',
    synthetic: true,
    summary:
      result.status === 'pass'
        ? 'A synthetic event proved that the configured SDK credential and Experience API destination accept requests. It does not prove application runtime delivery.'
        : result.status === 'skip'
          ? 'Credential/destination connectivity was not checked because no SDK credential was available.'
          : 'The synthetic credential/destination connectivity probe failed.',
    findings: result.findings,
  };
}

export function cmsGraphEvidence(
  result: ContentSurveyResult,
  profile: ValidationProfile = 'full-setup',
  targetMergeTagIdentifier?: string,
): ValidationStageEvidence {
  if (result.testScenario.kind === 'unavailable') {
    return {
      stage: 'cms-graph',
      status: 'unavailable',
      source: 'contentful-api',
      summary: result.testScenario.summary,
      findings: result.findings,
    };
  }

  if (profile === 'merge-tag-extension') {
    const hasPublishedMergeTag = targetMergeTagIdentifier
      ? result.publishedMergeTagIdentifiers.includes(targetMergeTagIdentifier)
      : false;
    const hasPreviewMergeTag = targetMergeTagIdentifier
      ? result.previewMergeTagIdentifiers.includes(targetMergeTagIdentifier)
      : false;
    return {
      stage: 'cms-graph',
      status: hasPublishedMergeTag ? 'pass' : targetMergeTagIdentifier ? 'fail' : 'warn',
      source: 'contentful-api',
      summary: hasPublishedMergeTag
        ? `The requested merge tag ${targetMergeTagIdentifier} is published.`
        : hasPreviewMergeTag
          ? `The requested merge tag ${targetMergeTagIdentifier} exists in preview but is not published.`
          : targetMergeTagIdentifier
            ? `The requested merge tag ${targetMergeTagIdentifier} was not found in published or preview content.`
            : `${result.publishedMergeTagCount} published merge tag(s) exist, but the requested merge tag was not identified. Inventory counts alone cannot validate this change.`,
      findings: result.findings,
    };
  }

  return {
    stage: 'cms-graph',
    status:
      result.status === 'pass'
        ? 'pass'
        : result.status === 'skip'
          ? 'unavailable'
          : result.status === 'warn'
            ? 'warn'
            : 'fail',
    source: 'contentful-api',
    summary: result.testScenario.summary,
    findings: result.findings,
  };
}

// The analytics doctor endpoint reports space-wide aggregate counts over 15 minutes. Even a
// non-zero result is supporting evidence, not proof that this workflow's page caused an event.
export function aggregateLiveEventsEvidence(result: OptimizationDoctorCheckResult): ValidationStageEvidence {
  return {
    stage: 'runtime-transport',
    status: result.status === 'fail' ? 'fail' : result.status === 'skip' ? 'unavailable' : 'warn',
    source: 'analytics-api',
    summary:
      result.status === 'pass'
        ? 'Recent events exist in this space, but the aggregate 15-minute window is not correlated to this validation run.'
        : result.status === 'warn'
          ? 'The Live Events endpoint is reachable, but no recent events were observed.'
          : result.status === 'skip'
            ? 'Automated Live Events evidence is unavailable without a server-only Management token.'
            : 'The automated Live Events check failed.',
    findings: result.findings,
  };
}

export function browserRuntimeEvidence(result: RuntimeCheckResult): ValidationStageEvidence {
  return {
    stage: 'runtime-transport',
    status: result.overallStatus,
    source: 'browser',
    summary: result.summary,
    findings: result.findings,
  };
}

export function manualRuntimeEvidence(
  outcome: 'end-to-end' | 'transport-only' | 'deferred' | 'blocked',
  profile: ValidationProfile = 'full-setup',
): ValidationStageEvidence[] {
  const applicable = new Set(getValidationStages(profile));
  const summaries: Record<ValidationProfile, { transport: string; outcome: string; incomplete: string }> = {
    'full-setup': {
      transport: 'The user confirmed a correlated application event in Contentful Live Events.',
      outcome: 'The user confirmed the expected audience or all-visitors experience and rendered variant.',
      incomplete: 'A specific audience, selected experience, and rendered variant were not confirmed.',
    },
    'component-extension': {
      transport: 'The user confirmed the target component exposure after intentional consent and interaction.',
      outcome: 'The user confirmed the target component selected and rendered the expected experience and variant.',
      incomplete: 'The component experience, variant, and rendered entry metadata were not all confirmed.',
    },
    'analytics-extension': {
      transport: 'The user confirmed each expected event and its intended analytics destination for this change.',
      outcome: 'The scoped analytics behavior was confirmed.',
      incomplete: 'The expected analytics events and destinations were not all confirmed.',
    },
    'experiment-authoring': {
      transport: 'The user confirmed the configured metric event for the authored experiment.',
      outcome: 'The user confirmed qualification, selected experiment variant, and rendered result.',
      incomplete: 'Qualification, selected experiment variant, and rendered result were not all confirmed.',
    },
    'merge-tag-extension': {
      transport: 'Runtime transport is not applicable to CMS merge-tag validation.',
      outcome:
        'The user confirmed the CMS merge tag resolves for the target profile and uses its fallback when absent.',
      incomplete: 'Both target-profile resolution and fallback behavior were not confirmed.',
    },
    'merge-tag-code-extension': {
      transport: 'Runtime transport is not applicable to code-authored merge-tag validation.',
      outcome:
        'The user confirmed the code-authored merge tag resolves for the target profile and uses its fallback when absent.',
      incomplete: 'Both target-profile resolution and fallback behavior were not confirmed.',
    },
    'diagnostic-repair': {
      transport: 'The user correlated the repaired runtime path with the original reproduction.',
      outcome: 'The user confirmed the original personalization symptom is repaired.',
      incomplete: 'The repaired personalization outcome was not fully confirmed.',
    },
  };
  const summary = summaries[profile];
  const evidence: ValidationStageEvidence[] = [];

  if (outcome === 'end-to-end') {
    if (applicable.has('runtime-transport')) {
      evidence.push({
        stage: 'runtime-transport',
        status: 'pass',
        source: 'manual-confirmation',
        summary: summary.transport,
        findings: [],
      });
    }
    if (applicable.has('personalization-outcome')) {
      evidence.push({
        stage: 'personalization-outcome',
        status: 'pass',
        source: 'manual-confirmation',
        summary: summary.outcome,
        findings: [],
      });
    }
    return evidence;
  }

  if (outcome === 'transport-only') {
    if (applicable.has('runtime-transport')) {
      evidence.push({
        stage: 'runtime-transport',
        status: 'pass',
        source: 'manual-confirmation',
        summary: summary.transport,
        findings: [],
      });
    }
    if (applicable.has('personalization-outcome')) {
      evidence.push({
        stage: 'personalization-outcome',
        status: 'unavailable',
        source: 'manual-confirmation',
        summary: summary.incomplete,
        findings: [],
      });
    }
    return evidence;
  }

  const status = outcome === 'blocked' ? 'blocked' : 'deferred';
  const qualifier = outcome === 'blocked' ? 'is blocked by an external constraint' : 'was explicitly deferred';
  if (applicable.has('runtime-transport')) {
    evidence.push({
      stage: 'runtime-transport',
      status,
      source: 'manual-confirmation',
      summary: `Runtime validation ${qualifier}.`,
      findings: [],
    });
  }
  if (applicable.has('personalization-outcome')) {
    evidence.push({
      stage: 'personalization-outcome',
      status,
      source: 'manual-confirmation',
      summary: `Outcome validation ${qualifier}. ${summary.incomplete}`,
      findings: [],
    });
  }
  return evidence;
}

export function buildLiveEventsUrl(spaceId?: string, environmentId?: string): string | undefined {
  if (!spaceId || !environmentId) return undefined;
  return `https://app.contentful.com/spaces/${encodeURIComponent(spaceId)}/environments/${encodeURIComponent(environmentId)}/apps/app_installations/contentful-personalization/analytics/realtime`;
}
