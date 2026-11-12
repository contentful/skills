// Shared helpers: credentials and Management API calls with logging.
// The content model comes from schema.mjs; writing, reading and checking recipes from recipe.mjs.
import { readFileSync, appendFileSync } from 'node:fs';

export { CONTENT_SOURCE, loadSchema } from './schema.mjs';
export { editorCheck } from './recipe.mjs';
export const EXPERIENCE_SOURCE = 'crn:contentful:::experience:spaces/$self/environments/$self';

/** Read KEY=value lines. Accepts CONTENTFUL_MANAGEMENT_TOKEN / CMA_TOKEN, EXO_SPACE_ID / SPACE_ID, EXO_ENVIRONMENT_ID / ENVIRONMENT_ID. */
export function loadEnv(path) {
  const env = { ...process.env };
  if (path) {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#') || !t.includes('=')) continue;
      const [k, ...v] = t.split('=');
      env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  const token = env.CONTENTFUL_MANAGEMENT_TOKEN || env.CMA_TOKEN;
  const spaceId = env.EXO_SPACE_ID || env.SPACE_ID;
  const environmentId = env.EXO_ENVIRONMENT_ID || env.ENVIRONMENT_ID || 'master';
  const baseUrl = env.API_BASE_URL || 'https://api.contentful.com';
  if (!token || !spaceId) throw new Error('Need CONTENTFUL_MANAGEMENT_TOKEN and EXO_SPACE_ID (in the env file or the environment). Pass the path of a credentials file with --env-file; never pass a token as an argument.');
  if (!baseUrl.startsWith('https://')) throw new Error('API_BASE_URL must start with https://');
  return { token, spaceId, environmentId, baseUrl };
}

/** Management API client. Every call is appended to logPath as one JSON line (no token). */
export function cma({ token, spaceId, environmentId, baseUrl }, logPath) {
  const base = `${baseUrl}/spaces/${spaceId}/environments/${environmentId}`;
  async function call(method, path, { body, version } = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (version !== undefined) headers['X-Contentful-Version'] = String(version);
    const t0 = Date.now();
    let res;
    for (let attempt = 0; ; attempt++) {                                // rate limited: wait and retry
      res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      if (res.status !== 429 || attempt >= 5) break;                    // up to ~30 s in all
      await new Promise(r => setTimeout(r, Math.max(Number(res.headers.get('x-contentful-ratelimit-reset')) || 0, 2 ** attempt) * 1000 + Math.random() * 500));
    }
    const text = await res.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text.slice(0, 500) }; }
    if (logPath) appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), method, path: path.split('?')[0], status: res.status, ms: Date.now() - t0, error: res.ok ? undefined : (json.message || json.sys?.id), details: res.ok ? undefined : json.details }) + '\n');
    return { status: res.status, ok: res.ok, json };
  }
  /** Follow ExO cursor pages (pages.next → ?pageNext=) and classic skip/total pages. */
  async function list(path) {
    const items = []; let cursor = null; let skip = 0;
    for (;;) {
      const q = new URLSearchParams({ limit: '100' });
      if (cursor) q.set('pageNext', cursor); else if (skip) q.set('skip', String(skip));
      const { ok, status, json } = await call('GET', `${path}?${q}`);
      if (!ok) return { items: null, status };
      items.push(...(json.items || []));
      if ('total' in json) { skip = json.skip + json.items.length; if (skip >= json.total) break; }
      else { cursor = json.pages?.next; if (!cursor) break; }
    }
    return { items, status: 200 };
  }
  return { call, list, base };
}

export const typeIdFromUrn = (urn) => urn.split('/').pop();
export const annotationOf = (entity) => (entity.metadata?.annotations?.ComponentType || entity.metadata?.annotations?.Template || [])[0]?.sys?.id || null;
