import { type, action } from '@contentful/skill-kit';
import { ContentSurveyResult, type Finding } from '../schemas.js';

const API_TIMEOUT_MS = 10_000;

// Contentful content type holding personalization experiences. Same model for both SDK families.
const EXPERIENCE_CONTENT_TYPE = 'nt_experience';
const AUDIENCE_CONTENT_TYPE = 'nt_audience';
const MERGE_TAG_CONTENT_TYPE = 'nt_mergetag';

// Reverse-link detection issues ~2 queries (CDA + CPA) per published experience. Cap it so a
// space with hundreds of experiences doesn't trigger a query storm — anything beyond this is
// reported as "checked N of M" and left to per-entry drill-down.
const MAX_REVERSE_LINK_EXPERIENCES = 20;

interface EntryListResult {
  ids?: string[];
  entries?: RawEntry[];
  httpStatus: number;
  error?: string;
}

interface RawEntry {
  sys?: { id?: string };
  fields?: Record<string, unknown>;
}

// List entry IDs for a query against the Entries endpoint. `extraParams` lets callers add
// filters such as content_type or links_to_entry.
async function fetchEntryIds(
  host: string,
  spaceId: string,
  environment: string,
  token: string,
  extraParams: Record<string, string>,
  parentSignal: AbortSignal,
): Promise<EntryListResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  parentSignal.addEventListener('abort', () => controller.abort());

  try {
    const url = new URL(`https://${host}/spaces/${spaceId}/environments/${environment}/entries`);
    url.searchParams.set('select', 'sys.id');
    url.searchParams.set('limit', '1000');
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = (await res.json()) as { items?: RawEntry[] };
      const entries = json.items ?? [];
      const ids = entries.map((item) => item.sys?.id).filter((id): id is string => !!id);
      return { ids, entries, httpStatus: res.status };
    }
    return { httpStatus: res.status };
  } catch (err) {
    clearTimeout(timeout);
    return { httpStatus: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

const fetchExperienceIds = (
  host: string,
  spaceId: string,
  environment: string,
  token: string,
  parentSignal: AbortSignal,
): Promise<EntryListResult> =>
  fetchEntryIds(
    host,
    spaceId,
    environment,
    token,
    {
      content_type: EXPERIENCE_CONTENT_TYPE,
      select: 'sys.id,fields.nt_experience_id,fields.nt_name,fields.nt_type,fields.nt_audience,fields.nt_variants',
    },
    parentSignal,
  );

const fetchAudienceIds = (
  host: string,
  spaceId: string,
  environment: string,
  token: string,
  parentSignal: AbortSignal,
): Promise<EntryListResult> =>
  fetchEntryIds(
    host,
    spaceId,
    environment,
    token,
    { content_type: AUDIENCE_CONTENT_TYPE, select: 'sys.id,fields.nt_audience_id,fields.nt_name' },
    parentSignal,
  );

const fetchMergeTagIds = (
  host: string,
  spaceId: string,
  environment: string,
  token: string,
  parentSignal: AbortSignal,
): Promise<EntryListResult> =>
  fetchEntryIds(
    host,
    spaceId,
    environment,
    token,
    { content_type: MERGE_TAG_CONTENT_TYPE, select: 'sys.id,fields.nt_mergetag_id,fields.nt_name' },
    parentSignal,
  );

function linkId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const sys = (value as { sys?: unknown }).sys;
  if (!sys || typeof sys !== 'object') return undefined;
  const id = (sys as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
}

function stringField(fields: Record<string, unknown>, name: string): string | undefined {
  const value = fields[name];
  return typeof value === 'string' ? value : undefined;
}

function linkedEntryIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map(linkId).filter((id): id is string => !!id) : [];
}

function mergeTagIdentifiers(entries: RawEntry[]): string[] {
  return [
    ...new Set(
      entries.flatMap((entry) =>
        [entry.sys?.id, stringField(entry.fields ?? {}, 'nt_mergetag_id')].filter(
          (identifier): identifier is string => !!identifier,
        ),
      ),
    ),
  ];
}

interface SurveyTestScenario {
  kind: 'all-visitors' | 'existing-targeted' | 'preview-only' | 'fixture-needed' | 'unavailable';
  summary: string;
  experienceEntryId?: string;
  experienceId?: string;
  experienceName?: string;
  audienceEntryId?: string;
  audienceId?: string;
  audienceName?: string;
  variantEntryIds: string[];
}

function deriveTestScenario(
  publishedExperiences: RawEntry[],
  previewExperiences: RawEntry[],
  audiences: RawEntry[],
): SurveyTestScenario {
  const audienceByEntryId = new Map(audiences.map((entry) => [entry.sys?.id, entry]));
  const describe = (entry: RawEntry) => {
    const fields = entry.fields ?? {};
    const audienceEntryId = linkId(fields.nt_audience);
    const audience = audienceEntryId ? audienceByEntryId.get(audienceEntryId) : undefined;
    const audienceFields = audience?.fields ?? {};
    return {
      experienceEntryId: entry.sys?.id,
      experienceId: stringField(fields, 'nt_experience_id'),
      experienceName: stringField(fields, 'nt_name'),
      audienceEntryId,
      audienceId: stringField(audienceFields, 'nt_audience_id'),
      audienceName: stringField(audienceFields, 'nt_name'),
      variantEntryIds: linkedEntryIds(fields.nt_variants),
      explicitlyAllVisitors: Object.hasOwn(fields, 'nt_audience') && fields.nt_audience === null,
    };
  };

  const published = publishedExperiences.map(describe);
  const allVisitors = published.find((experience) => experience.explicitlyAllVisitors);
  if (allVisitors) {
    const { explicitlyAllVisitors: _, ...details } = allVisitors;
    return {
      kind: 'all-visitors',
      summary:
        'A published all-visitors experience is available. Use its existing baseline route as the deterministic validation target.',
      ...details,
    };
  }

  const targeted = published[0];
  if (targeted) {
    const { explicitlyAllVisitors: _, ...details } = targeted;
    return {
      kind: 'existing-targeted',
      summary:
        'A published targeted experience is available, but its server-side audience rules cannot be derived from the CMS entry. Ask for a known trigger, use natural qualification, or use the preview panel.',
      ...details,
    };
  }

  const preview = previewExperiences[0];
  if (preview) {
    const { explicitlyAllVisitors: _, ...details } = describe(preview);
    return {
      kind: 'preview-only',
      summary:
        'Personalization content exists only in preview. Publish the required dependencies or validate deliberately against a preview environment.',
      ...details,
    };
  }

  return {
    kind: 'fixture-needed',
    summary:
      'No usable experience exists. Offer an explicitly opted-in test fixture with an obvious variant and deterministic audience condition, or let the user defer live validation.',
    variantEntryIds: [],
  };
}

// Baseline entries that reference a given experience via their nt_experiences field. Contentful's
// reverse-reference query (links_to_entry) returns exactly these.
const fetchBaselinesLinkingTo = (
  host: string,
  spaceId: string,
  environment: string,
  token: string,
  experienceId: string,
  parentSignal: AbortSignal,
): Promise<EntryListResult> =>
  fetchEntryIds(host, spaceId, environment, token, { links_to_entry: experienceId }, parentSignal);

function errorFinding(label: string, result: EntryListResult): Finding | undefined {
  if (result.error) {
    return { item: `${label} connectivity`, status: 'fail', detail: `Network error: ${result.error}` };
  }
  if (result.httpStatus === 401 || result.httpStatus === 403) {
    return {
      item: `${label} authentication`,
      status: 'fail',
      detail: `Token rejected (HTTP ${result.httpStatus}) — check that the token is a valid ${label} token`,
    };
  }
  if (result.httpStatus === 404) {
    return {
      item: `${label} content type`,
      status: 'warn',
      detail: `The ${EXPERIENCE_CONTENT_TYPE} content type was not found — the Contentful Personalization app may not be installed in this space/environment`,
    };
  }
  if (result.ids === undefined) {
    return { item: label, status: 'fail', detail: `Unexpected HTTP ${result.httpStatus}` };
  }
  return undefined;
}

// For each published experience, check which baseline entries link to it in published (CDA) vs
// preview (CPA). The common, hard-to-spot failure: the experience is published but the baseline's
// nt_experiences link was never re-published, so the live site never resolves the experience.
async function detectBaselineLinkIssues(
  spaceId: string,
  environment: string,
  accessToken: string,
  previewToken: string | undefined,
  publishedExperienceIds: string[],
  signal: AbortSignal,
): Promise<{ findings: Finding[]; suspiciousEntryIds: string[] }> {
  const findings: Finding[] = [];
  const suspiciousEntryIds: string[] = [];

  const toCheck = publishedExperienceIds.slice(0, MAX_REVERSE_LINK_EXPERIENCES);

  if (publishedExperienceIds.length > MAX_REVERSE_LINK_EXPERIENCES) {
    findings.push({
      item: 'Baseline link check (partial)',
      status: 'skip',
      detail: `Checked baseline links for ${toCheck.length} of ${publishedExperienceIds.length} published experiences (capped for performance). Inspect the remaining entries individually if needed.`,
    });
  }

  const perExperience = await Promise.all(
    toCheck.map(async (expId) => {
      const [cda, cpa] = await Promise.all([
        fetchBaselinesLinkingTo('cdn.contentful.com', spaceId, environment, accessToken, expId, signal),
        previewToken
          ? fetchBaselinesLinkingTo('preview.contentful.com', spaceId, environment, previewToken, expId, signal)
          : Promise.resolve(undefined),
      ]);
      return { expId, cda, cpa };
    }),
  );

  for (const { expId, cda, cpa } of perExperience) {
    // If the reverse query itself failed, skip this experience silently — the count-based
    // findings above already surface broad connectivity/auth problems.
    if (cda.ids === undefined) continue;

    const publishedBaselines = new Set(cda.ids);
    const previewBaselines = new Set(cpa?.ids ?? []);
    const draftOnlyBaselines = [...previewBaselines].filter((id) => !publishedBaselines.has(id));

    if (draftOnlyBaselines.length > 0) {
      // The user's exact bug: a baseline links to the experience in preview but not in published.
      findings.push({
        item: `Unpublished baseline link (experience ${expId})`,
        status: 'fail',
        detail: `${draftOnlyBaselines.length} baseline entr${draftOnlyBaselines.length === 1 ? 'y links' : 'ies link'} to this published experience in preview but not in published content. Re-publish the baseline entr${draftOnlyBaselines.length === 1 ? 'y' : 'ies'} so the live site resolves the experience.`,
      });
      suspiciousEntryIds.push(...draftOnlyBaselines);
    } else if (publishedBaselines.size === 0) {
      // Published experience that nothing links to (in published, and not in preview either).
      findings.push({
        item: `Unattached experience (${expId})`,
        status: 'warn',
        detail: cpa
          ? 'This experience is published but no entry links to it via the nt_experiences field, so it will never render. Attach it to a baseline entry in the Contentful Personalization app.'
          : 'No published entry links to this experience. Provide a Preview API token to confirm whether a draft link exists that needs publishing.',
      });
    }
  }

  return { findings, suspiciousEntryIds };
}

export const surveyContent = action({
  name: 'survey-content',
  input: type({
    spaceId: 'string',
    environment: "string = 'master'",
    'accessToken?': 'string',
    'previewToken?': 'string',
  }),
  output: ContentSurveyResult,
  run: async ({ input, signal }) => {
    if (!input.spaceId || (!input.accessToken && !input.previewToken)) {
      return {
        status: 'skip' as const,
        findings: [
          {
            item: 'Content survey',
            status: 'skip' as const,
            detail: 'No Contentful space ID and token available — cannot survey personalization content',
          },
        ],
        publishedExperienceCount: 0,
        previewExperienceCount: 0,
        publishedAudienceCount: 0,
        previewAudienceCount: 0,
        publishedMergeTagCount: 0,
        previewMergeTagCount: 0,
        publishedMergeTagIdentifiers: [],
        previewMergeTagIdentifiers: [],
        testScenario: {
          kind: 'unavailable' as const,
          summary:
            'CMS inventory is unavailable because no Delivery or Preview credential was found. Do not infer that experiences or audiences are missing; add a token or use a known scenario supplied by the user.',
          variantEntryIds: [],
        },
        suspiciousEntryIds: [],
      };
    }

    const findings: Finding[] = [];

    const [cda, cpa, cdaAudiences, cpaAudiences, cdaMergeTags, cpaMergeTags] = await Promise.all([
      input.accessToken
        ? fetchExperienceIds('cdn.contentful.com', input.spaceId, input.environment, input.accessToken, signal)
        : Promise.resolve(undefined),
      input.previewToken
        ? fetchExperienceIds('preview.contentful.com', input.spaceId, input.environment, input.previewToken, signal)
        : Promise.resolve(undefined),
      input.accessToken
        ? fetchAudienceIds('cdn.contentful.com', input.spaceId, input.environment, input.accessToken, signal)
        : Promise.resolve(undefined),
      input.previewToken
        ? fetchAudienceIds('preview.contentful.com', input.spaceId, input.environment, input.previewToken, signal)
        : Promise.resolve(undefined),
      input.accessToken
        ? fetchMergeTagIds('cdn.contentful.com', input.spaceId, input.environment, input.accessToken, signal)
        : Promise.resolve(undefined),
      input.previewToken
        ? fetchMergeTagIds('preview.contentful.com', input.spaceId, input.environment, input.previewToken, signal)
        : Promise.resolve(undefined),
    ]);

    const cdaError = cda ? errorFinding('Delivery API', cda) : undefined;
    const cpaError = cpa ? errorFinding('Preview API', cpa) : undefined;
    if (cdaError) findings.push(cdaError);
    if (cpaError) findings.push(cpaError);

    const publishedIds = new Set(cda?.ids ?? []);
    const previewIds = new Set(cpa?.ids ?? []);
    const publishedExperienceCount = publishedIds.size;
    const previewExperienceCount = previewIds.size;
    const publishedAudienceCount = cdaAudiences?.ids?.length ?? 0;
    const previewAudienceCount = cpaAudiences?.ids?.length ?? 0;
    const publishedMergeTagCount = cdaMergeTags?.ids?.length ?? 0;
    const previewMergeTagCount = cpaMergeTags?.ids?.length ?? 0;
    const publishedMergeTagIdentifiers = mergeTagIdentifiers(cdaMergeTags?.entries ?? []);
    const previewMergeTagIdentifiers = mergeTagIdentifiers(cpaMergeTags?.entries ?? []);

    // Experiences that exist in preview (draft) but are not published yet.
    const suspiciousEntryIds = new Set<string>([...previewIds].filter((id) => !publishedIds.has(id)));

    if (cda && !cdaError) {
      if (publishedExperienceCount === 0) {
        findings.push({
          item: 'Published experiences',
          status: previewExperienceCount > 0 ? 'fail' : 'warn',
          detail:
            previewExperienceCount > 0
              ? 'No experiences are published, but some exist in preview — they need to be published to take effect.'
              : 'No published experiences found. If you expect personalization to be live, create and publish an experience in the Contentful Personalization app.',
        });
      } else {
        findings.push({
          item: 'Published experiences',
          status: 'pass',
          detail: `${publishedExperienceCount} published experience(s) found`,
        });
      }
    }

    if (cda && cpa && !cdaError && !cpaError && previewExperienceCount > publishedExperienceCount) {
      const unpublished = [...previewIds].filter((id) => !publishedIds.has(id));
      findings.push({
        item: 'Unpublished experiences',
        status: 'fail',
        detail: `${unpublished.length} experience(s) exist in preview but are not published. Publish them (variants first, then experiences, then republish the baseline entries).`,
      });
    }

    // Reverse-link check: does a *published baseline* actually link to each published experience?
    // This is the count-blind failure mode — everything looks published, but the baseline's
    // nt_experiences link is still a draft. Requires the Delivery API (to know published state).
    if (cda && !cdaError && input.accessToken && publishedExperienceCount > 0) {
      const linkResult = await detectBaselineLinkIssues(
        input.spaceId,
        input.environment,
        input.accessToken,
        input.previewToken,
        [...publishedIds],
        signal,
      );
      findings.push(...linkResult.findings);
      for (const id of linkResult.suspiciousEntryIds) suspiciousEntryIds.add(id);
    }

    const hasFail = findings.some((f) => f.status === 'fail');
    const hasWarn = findings.some((f) => f.status === 'warn');
    const status = hasFail ? ('fail' as const) : hasWarn ? ('warn' as const) : ('pass' as const);

    const requestedExperienceInventories = [...(input.accessToken ? [cda] : []), ...(input.previewToken ? [cpa] : [])];
    const inventoryUnavailable =
      requestedExperienceInventories.length > 0 &&
      requestedExperienceInventories.every((result) => result?.ids === undefined);
    const testScenario: SurveyTestScenario = inventoryUnavailable
      ? {
          kind: 'unavailable',
          summary:
            'CMS inventory could not be retrieved. Do not infer that experiences, audiences, or merge tags are missing; fix Content API connectivity or authentication, then rerun the survey or use a scenario the user already knows.',
          variantEntryIds: [],
        }
      : deriveTestScenario(cda?.entries ?? [], cpa?.entries ?? [], [
          ...(cdaAudiences?.entries ?? []),
          ...(cpaAudiences?.entries ?? []),
        ]);

    return {
      status,
      findings,
      publishedExperienceCount,
      previewExperienceCount,
      publishedAudienceCount,
      previewAudienceCount,
      publishedMergeTagCount,
      previewMergeTagCount,
      publishedMergeTagIdentifiers,
      previewMergeTagIdentifiers,
      testScenario,
      suspiciousEntryIds: [...suspiciousEntryIds],
      ...(hasFail ? { error: findings.find((f) => f.status === 'fail')?.detail } : {}),
    };
  },
});
