// The content model as the bindings layer sees it, read from the environment's GraphQL schema.
//
// The Management API serves the schema as SDL at /graphql_schema. Every bindable field carries a
// @fieldResolver(kind, data) directive and every content type a @typeIdentifier(contentTypeId) directive, so the
// GraphQL names (`itemsCursorCollection`, not `items`), types, requiredness and allowed reference types are read,
// never guessed.
//
// Covers content in the same space and environment. Fields that reference another space or an external resource
// (@fieldResolver kind "resource-link…") are listed in `unsupported` and left out of getFields().
import { appendFileSync } from 'node:fs';
import { buildASTSchema, parse, getNamedType, isObjectType, isUnionType, isInterfaceType, isListType, isNonNullType, Kind, valueFromASTUntyped } from 'graphql';

export const CONTENT_SOURCE = 'crn:contentful:::content:spaces/$self/environments/$self';
const typeLink = (id) => ({ sys: { type: 'ResourceLink', linkType: 'Contentful:ContentType', urn: `${CONTENT_SOURCE}/contentTypes/${id}` } });
const ASSET_LINK = { sys: { type: 'ResourceLink', linkType: 'Contentful:Asset', urn: `${CONTENT_SOURCE}/assets` } };
const entryRef = (id) => { const ref = typeLink(id); return { type: 'TypeRef', ref, source: ref.sys.urn }; };

const SKIP = new Set(['node-interface-field', 'metadata', 'linked-from-namespace', 'linked-from-collections', 'sys-field']);
const LIST_ANY = new Set(['nested-collection', 'nested-cursor-collection']);
const LIST_ALLOWED = new Set(['nested-collection-with-content-types', 'nested-cursor-collection-with-content-types']);
const CURSOR = new Set(['nested-cursor-collection', 'nested-cursor-collection-with-content-types']);
const CARRIES_REQUIRED = new Set(['primitive-field', 'rich-text', 'entry-link-field', 'asset-link-field', ...LIST_ANY, ...LIST_ALLOWED]);
const SCALARS = { String: 'String', DateTime: 'DateTime', Int: 'Integer', Float: 'Number', Boolean: 'Boolean', JSON: 'JSON' };

/** @fieldResolver(kind: "...", data: {...}) on a field or root query field, or null. */
export function fieldResolver(node) {
  const d = node?.directives?.find(x => x.name.value === 'fieldResolver');
  if (!d?.arguments) return null;
  let kind, data;
  for (const a of d.arguments) {
    if (a.name.value === 'kind' && a.value.kind === Kind.STRING) kind = a.value.value;
    else if (a.name.value === 'data' && a.value.kind === Kind.OBJECT) data = valueFromASTUntyped(a.value);
  }
  return kind == null ? null : { kind, data: data || {} };
}
const typeIdentifier = (type) => {
  const a = type.astNode?.directives?.find(d => d.name.value === 'typeIdentifier')?.arguments?.find(x => x.name.value === 'contentTypeId');
  return a?.value.kind === Kind.STRING ? a.value.value : undefined;
};
const hasList = (t) => isNonNullType(t) ? hasList(t.ofType) : isListType(t);

/** logPath: when given, the read is appended to the run's API log like every other call (no token). */
export async function fetchSdl({ token, spaceId, environmentId, baseUrl }, logPath) {
  const t0 = Date.now();
  const url = `${baseUrl}/spaces/${encodeURIComponent(spaceId)}/environments/${encodeURIComponent(environmentId)}/graphql_schema`;
  let res;
  for (let attempt = 0; ; attempt++) {                                  // the Management API rate-limits bursts: wait and retry
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status !== 429 || attempt >= 5) break;                    // up to ~30 s in all
    await new Promise(r => setTimeout(r, Math.max(Number(res.headers.get('x-contentful-ratelimit-reset')) || 0, 2 ** attempt) * 1000 + Math.random() * 500));
  }
  if (logPath) appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), method: 'GET', path: '/graphql_schema', status: res.status, ms: Date.now() - t0 }) + '\n');
  if (res.status === 401 || res.status === 403) throw new Error(`HTTP ${res.status} reading the GraphQL schema: check the management token and its access to this space.`);
  if (res.status === 404) throw new Error('GraphQL schema not found (404): check the space and environment ids.');
  if (!res.ok) throw new Error(`HTTP ${res.status} reading the GraphQL schema from ${url.split('?')[0]}`);
  return res.text();
}
export async function loadSchema(creds, logPath) { return schemaFromSdl(await fetchSdl(creds, logPath)); }

/**
 * Returns { gql, roots, rootByName, rootById, assetRoot, idToName, nameToId, getFields(ref), unsupported }.
 * roots:      [{ name: 'ComponentQuote', type: 'TypeRef', ref, source }], plus Asset.
 * getFields:  { <graphqlFieldName>: { id, name, type, required, fieldId, contentTypeId?, ref?/items?/members?, branch? } }
 *   type is String | DateTime | Integer | Number | Boolean | JSON | RichText | TypeRef | DiscriminatedUnion | Array.
 *   branch: true when the schema types the reference (or the list's items) as a union, even a union of one. A
 *   selection through it must be written with $on, or the GraphQL API rejects the query.
 */
export function schemaFromSdl(sdl) {
  const gql = buildASTSchema(parse(sdl));
  const types = Object.values(gql.getTypeMap());
  const entryInterface = gql.getType('Entry');
  const entryNames = new Set(isInterfaceType(entryInterface) ? gql.getPossibleTypes(entryInterface).map(t => t.name) : []);
  // types reachable only through a cross-space / external ResourceLink wrapper are not this environment's content types
  const delegated = new Set();
  const resourceLink = gql.getType('ResourceLink');
  if (isInterfaceType(resourceLink)) for (const t of gql.getPossibleTypes(resourceLink)) {
    const node = t.getFields().node && getNamedType(t.getFields().node.type);
    if (isUnionType(node)) for (const m of node.getTypes()) delegated.add(m.name);
  }
  const idToName = new Map(), nameToId = new Map();
  for (const t of types) {
    if (!isObjectType(t) || delegated.has(t.name)) continue;
    const id = typeIdentifier(t); if (id === undefined) continue;
    idToName.set(id, t.name); nameToId.set(t.name, id);
  }
  // a list field created for several content types names a synthetic "AOrBOrC" type; map it to its real members
  const proxies = new Map();
  for (const name of entryNames) for (const f of Object.values(gql.getType(name).getFields())) {
    const r = fieldResolver(f.astNode); if (!r || !LIST_ALLOWED.has(r.kind)) continue;
    const members = [...new Set((Array.isArray(r.data.proxiedContentTypesIds) ? r.data.proxiedContentTypesIds : []).filter(x => typeof x === 'string'))];
    if (typeof r.data.creatingContentTypeId === 'string' && members.length) proxies.set(r.data.creatingContentTypeId, members);
  }
  const expand = (ids) => { const out = []; for (const id of ids) for (const m of proxies.get(id) || [id]) if (!out.includes(m)) out.push(m); return out; };

  const roots = [];
  for (const f of Object.values(gql.getQueryType()?.getFields() || {})) {
    const r = fieldResolver(f.astNode); const name = getNamedType(f.type).name;
    if (r?.kind === 'entry' && nameToId.has(name)) { const ref = typeLink(nameToId.get(name)); roots.push({ name, type: 'TypeRef', ref, source: ref.sys.urn }); }
    else if (r?.kind === 'asset') roots.push({ name, type: 'TypeRef', ref: ASSET_LINK });
  }
  const unsupported = [];

  function required(r) {
    if (r.kind === 'asset-url') return true;
    if (r.kind === 'asset-subfield') return r.data.subfieldName === 'assetFileName';
    if (!CARRIES_REQUIRED.has(r.kind)) return false;
    if (r.kind === 'primitive-field' && !r.data.contentTypeId) return r.data.id === 'title'; // asset title
    return r.data.required === true;
  }
  function describe(name, f, r, ownerName) {
    if (SKIP.has(r.kind)) return null;
    if (r.kind === 'asset-subfield' && (!r.data.subfieldName || r.data.subfieldName === 'assetContentType')) return null;
    if (r.kind.startsWith('resource-link')) { unsupported.push({ type: ownerName, field: name, reason: 'references another space or an external resource' }); return null; }
    const named = getNamedType(f.type), list = hasList(f.type), req = required(r);
    const withReq = (item) => req ? { ...item, required: true } : item;
    if (named.name === 'Asset' || entryNames.has(named.name)) {
      const item = named.name === 'Asset' ? { type: 'TypeRef', ref: ASSET_LINK } : nameToId.has(named.name) ? entryRef(nameToId.get(named.name)) : null;
      if (!item) return null;
      return list ? { id: name, name, type: 'Array', items: withReq(item), required: req }
                  : { id: name, name, type: 'TypeRef', ref: item.ref, ...(item.source && { source: item.source }), required: req };
    }
    const many = LIST_ANY.has(r.kind) || LIST_ALLOWED.has(r.kind);
    // a collection wrapper type: the reference type is the type of its `items`
    const target = many && isObjectType(named) && named.getFields().items ? getNamedType(named.getFields().items.type) : named;
    let declared = [];
    if (LIST_ALLOWED.has(r.kind)) { const p = r.data.proxiedContentTypesIds; declared = Array.isArray(p) && p.length ? p.filter(x => typeof x === 'string') : [r.data.creatingContentTypeId]; }
    else if (r.kind === 'entry-link-field' && typeof r.data.contentTypeId === 'string') declared = [r.data.contentTypeId];
    const open = !declared.length && !isUnionType(named) && ((r.kind === 'entry-link-field' && named.name === 'Entry') || many);
    const ids = expand(declared.length ? declared
      : isUnionType(named) ? named.getTypes().filter(m => entryNames.has(m.name)).map(m => nameToId.get(m.name)).filter(x => x !== undefined)
      : open ? [...entryNames].map(n => nameToId.get(n)).filter(x => x !== undefined) : []).filter(id => idToName.has(id));
    if (ids.length) {
      const shape = ids.length === 1 ? entryRef(ids[0]) : { type: 'DiscriminatedUnion', discriminator: 'urn', members: ids.map(entryRef) };
      const apiName = name.replace(/CursorCollection$|Collection$/, '');
      const extra = { ...(open && { isOpenEnded: true }), ...((isUnionType(target) || isInterfaceType(target)) && { branch: true }) };
      if (many) return { id: name, name: apiName, type: 'Array', items: withReq(shape), required: req, ...extra };
      if (shape.type === 'TypeRef') return { id: name, name: apiName, type: 'TypeRef', ref: shape.ref, source: shape.source, required: req, ...extra };
      return { id: name, name: apiName, type: 'DiscriminatedUnion', discriminator: 'urn', members: shape.members, required: req, ...extra };
    }
    if (r.kind === 'rich-text') return { id: name, name, type: 'RichText', required: req };
    if (r.kind !== 'primitive-field' && r.kind !== 'asset-url' && r.kind !== 'asset-subfield') return null;
    const leaf = SCALARS[named.name]; if (!leaf) return null;
    return list ? { id: name, name, type: 'Array', items: withReq({ type: leaf }), required: req } : { id: name, name, type: leaf, required: req };
  }

  const cache = new Map();
  function getFields(ref) {
    const urn = ref?.sys?.urn; if (cache.has(urn)) return cache.get(urn);
    const isAsset = ref?.sys?.linkType === 'Contentful:Asset';
    const contentTypeId = isAsset ? null : urn?.startsWith(`${CONTENT_SOURCE}/contentTypes/`) ? urn.split('/').pop() : undefined;
    const type = isAsset ? gql.getType('Asset') : gql.getType(idToName.get(contentTypeId));
    if (!isObjectType(type) || (!isAsset && !entryNames.has(type.name))) throw new Error(`"${urn}" is not a content type or the asset type of this environment.`);
    const out = {}, seen = new Map();
    for (const [name, f] of Object.entries(type.getFields())) {
      const r = fieldResolver(f.astNode); if (!r) continue;
      const owner = r.data.parentContentTypeId ?? r.data.contentTypeId;
      if (contentTypeId !== null && typeof owner === 'string' && owner !== contentTypeId) continue;
      const mapped = describe(name, f, r, type.name); if (!mapped) continue;
      const cmsId = r.kind === 'asset-url' || r.kind === 'asset-subfield' ? name : (r.data.fieldId ?? r.data.id);
      if (typeof cmsId !== 'string') continue;
      // the same CMS field can appear as `xCollection` and `xCursorCollection`: keep the cursor form
      const cursor = CURSOR.has(r.kind), prev = seen.get(cmsId);
      if (prev) { if (prev.cursor || !cursor) continue; delete out[prev.name]; }
      seen.set(cmsId, { name, cursor });
      out[name] = { ...mapped, fieldId: cmsId, ...(contentTypeId !== null && { contentTypeId }) };
    }
    cache.set(urn, out); return out;
  }

  const rootByName = Object.fromEntries(roots.map(r => [r.name, r]));
  const rootById = Object.fromEntries(roots.filter(r => r.source).map(r => [r.ref.sys.urn.split('/').pop(), r]));
  return { gql, roots, rootByName, rootById, assetRoot: roots.find(r => r.ref.sys.linkType === 'Contentful:Asset') || null, idToName, nameToId, getFields, unsupported };
}
