import type {
  ValidationEvidenceStatus,
  ValidationFinalState,
  ValidationProfile,
  ValidationRequirement,
  ValidationStage,
  ValidationStageEvidence,
} from '../schemas.js';

export const VALIDATION_STAGES: ValidationStage[] = [
  'local-integrity',
  'credential-connectivity',
  'cms-graph',
  'runtime-transport',
  'personalization-outcome',
];

type ValidationRequirements = Record<ValidationStage, ValidationRequirement>;

const PROFILE_REQUIREMENTS: Record<ValidationProfile, ValidationRequirements> = {
  'full-setup': {
    'local-integrity': 'required',
    'credential-connectivity': 'required',
    'cms-graph': 'required',
    'runtime-transport': 'recommended',
    'personalization-outcome': 'recommended',
  },
  'component-extension': {
    'local-integrity': 'required',
    'credential-connectivity': 'not-applicable',
    'cms-graph': 'required',
    'runtime-transport': 'required',
    'personalization-outcome': 'required',
  },
  'analytics-extension': {
    'local-integrity': 'required',
    'credential-connectivity': 'required',
    'cms-graph': 'not-applicable',
    'runtime-transport': 'required',
    'personalization-outcome': 'not-applicable',
  },
  'experiment-authoring': {
    'local-integrity': 'not-applicable',
    'credential-connectivity': 'not-applicable',
    'cms-graph': 'required',
    'runtime-transport': 'required',
    'personalization-outcome': 'required',
  },
  'merge-tag-extension': {
    'local-integrity': 'required',
    'credential-connectivity': 'not-applicable',
    'cms-graph': 'required',
    'runtime-transport': 'not-applicable',
    'personalization-outcome': 'required',
  },
  'merge-tag-code-extension': {
    'local-integrity': 'required',
    'credential-connectivity': 'not-applicable',
    'cms-graph': 'not-applicable',
    'runtime-transport': 'not-applicable',
    'personalization-outcome': 'required',
  },
  'diagnostic-repair': {
    'local-integrity': 'required',
    'credential-connectivity': 'required',
    'cms-graph': 'required',
    'runtime-transport': 'required',
    'personalization-outcome': 'required',
  },
};

const DOWNSTREAM_STAGES: Record<ValidationStage, ValidationStage[]> = {
  'local-integrity': [
    'local-integrity',
    'credential-connectivity',
    'cms-graph',
    'runtime-transport',
    'personalization-outcome',
  ],
  'credential-connectivity': ['credential-connectivity', 'cms-graph', 'runtime-transport', 'personalization-outcome'],
  'cms-graph': ['cms-graph', 'runtime-transport', 'personalization-outcome'],
  'runtime-transport': ['runtime-transport', 'personalization-outcome'],
  'personalization-outcome': ['personalization-outcome'],
};

export type ValidationDecision =
  | 'continue'
  | 'defer-live-validation'
  | 'cannot-author-or-trigger'
  | 'cannot-complete-validation';

export interface DeriveValidationStateInput {
  profile: ValidationProfile;
  evidence: ValidationStageEvidence[];
  decision?: ValidationDecision;
  requiredStages?: ValidationStage[];
}

export function getValidationRequirements(profile: ValidationProfile): ValidationRequirements {
  return { ...PROFILE_REQUIREMENTS[profile] };
}

export function getValidationStages(profile: ValidationProfile): ValidationStage[] {
  const requirements = PROFILE_REQUIREMENTS[profile];
  return VALIDATION_STAGES.filter((stage) => requirements[stage] !== 'not-applicable');
}

export function filterValidationEvidence(
  profile: ValidationProfile,
  evidence: ValidationStageEvidence[],
): ValidationStageEvidence[] {
  const applicable = new Set(getValidationStages(profile));
  return evidence.filter((item) => applicable.has(item.stage));
}

export function getRerunStages(
  changedStage: ValidationStage,
  profile: ValidationProfile = 'diagnostic-repair',
): ValidationStage[] {
  const requirements = PROFILE_REQUIREMENTS[profile];
  return DOWNSTREAM_STAGES[changedStage].filter((stage) => requirements[stage] !== 'not-applicable');
}

export function getEvidenceRerunStages(
  profile: ValidationProfile,
  evidence: ValidationStageEvidence[],
): ValidationStage[] {
  const statuses = new Map(evidence.map((item) => [item.stage, item.status]));
  const firstUnresolved = getValidationStages(profile).find((stage) => {
    const status = statuses.get(stage);
    return status !== 'pass' && status !== 'not-applicable';
  });
  return firstUnresolved ? getRerunStages(firstUnresolved, profile) : [];
}

function isIncomplete(status: ValidationEvidenceStatus | undefined): boolean {
  return status === undefined || status === 'unavailable' || status === 'deferred' || status === 'blocked';
}

export function deriveValidationFinalState({
  profile,
  evidence,
  decision = 'continue',
  requiredStages,
}: DeriveValidationStateInput): ValidationFinalState {
  const requirements = PROFILE_REQUIREMENTS[profile];
  const statuses = new Map(evidence.map((item) => [item.stage, item.status]));

  if (decision === 'cannot-author-or-trigger') {
    return 'blocked-by-cms-authoring-or-publishing';
  }
  if (decision === 'cannot-complete-validation') {
    return 'blocked-by-validation-constraints';
  }

  const applicableStages =
    requiredStages ?? VALIDATION_STAGES.filter((stage) => requirements[stage] !== 'not-applicable');
  const failedStage = applicableStages.find((stage) => statuses.get(stage) === 'fail');
  if (failedStage) {
    return 'validation-failed';
  }

  if (decision === 'defer-live-validation') {
    return 'implementation-complete-validation-deferred';
  }

  const requiredIncomplete = applicableStages.some(
    (stage) =>
      (requiredStages !== undefined || requirements[stage] === 'required') && isIncomplete(statuses.get(stage)),
  );
  if (requiredIncomplete) {
    return 'implementation-complete-live-validation-pending';
  }

  const endToEndIncomplete = applicableStages.some((stage) => {
    const status = statuses.get(stage);
    return isIncomplete(status) || status === 'warn';
  });

  return endToEndIncomplete ? 'implementation-complete-live-validation-pending' : 'validated-end-to-end';
}

export function describeValidationFinalState(finalState: ValidationFinalState): string {
  switch (finalState) {
    case 'validated-end-to-end':
      return 'Validated end to end';
    case 'implementation-complete-validation-deferred':
      return 'Implementation complete; validation deferred';
    case 'implementation-complete-live-validation-pending':
      return 'Implementation complete; live validation pending';
    case 'blocked-by-cms-authoring-or-publishing':
      return 'Blocked by CMS authoring or publishing';
    case 'blocked-by-validation-constraints':
      return 'Blocked by validation constraints';
    case 'validation-failed':
      return 'Validation failed';
  }
}
