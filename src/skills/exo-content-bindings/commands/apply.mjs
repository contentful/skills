// apply: write approved recipes to Contentful: upsert each Data Assembly, publish it, and add it to the
// component/template that offers it. Then read everything back and verify. Reads <out-dir>/payloads/*.json
// produced by build. Every call is logged to api_log.jsonl.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, cma, loadSchema, editorCheck, typeIdFromUrn, EXPERIENCE_SOURCE } from '../lib/client.mjs';
import { flags, list, emit, CliError } from '../lib/cli.mjs';


export const usage = `apply --env-file <file> --out-dir <dir> --approved [--only <id,id>] [--no-publish]
      [--allow-api-only <id,id>] [--publish-owners]

Create or update the binding sets build generated, publish them, and offer them on their components/templates.
THIS WRITES TO CONTENTFUL. Run it only after the user approved the proposal.

  --env-file <file>          credentials file (see discover)
  --out-dir <dir>            the working directory build wrote payloads to
  --approved                 required: confirms the user approved these recipes in this conversation
  --only <id,id>             apply only these recipes (the ones the user approved)
  --no-publish               save as drafts
  --allow-api-only <id,id>   recipes the user explicitly agreed to keep read-only in the component editor
  --publish-owners           also publish the components/templates, children first (a visible change for editors)

Prints JSON: per recipe what was saved, published and linked, then a read-back check including whether the
component editor can edit what the server stored. Exit 2 when refused (no --approved, an API-only recipe without
--allow-api-only), exit 1 when a write or the read-back check failed.`;

export async function run(argv) {
  const f = flags(argv, { 'env-file': { type: 'string' }, 'out-dir': { type: 'string' }, approved: { type: 'boolean' }, only: { type: 'string' }, 'no-publish': { type: 'boolean' }, 'allow-api-only': { type: 'string' }, 'publish-owners': { type: 'boolean' } }, ['env-file', 'out-dir']);
  const envFile = f['env-file'], outDir = f['out-dir'];
  const flag = (n) => !!f[n.replace(/^--/, '')];
  const only = list(f.only), allowApiOnly = list(f['allow-api-only']);
  if (!flag('--approved')) throw new CliError('Refusing to write: pass --approved after the user has approved the proposal.', 2);
  const creds = loadEnv(envFile);
  const api = cma(creds, join(outDir, 'api_log.jsonl'));

  const payloads = readdirSync(join(outDir, 'payloads')).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(outDir, 'payloads', f), 'utf8')))
    .filter(p => !only.length || only.includes(p.body.sys.id));
  // API-only recipes need their own explicit confirmation. Payloads from an older build.mjs have no editor block: rebuild.
  const blocked = payloads.filter(p => !p.editor || (!p.editor.editable && !allowApiOnly.includes(p.body.sys.id)));
  if (blocked.length) throw new CliError(blocked.map(p => p.editor
    ? `Refusing ${p.body.sys.id}: API only — the component editor would show it read-only (${p.editor.causes.map(c => `${c.where} ${c.why}`).join('; ')}). Pass --allow-api-only ${p.body.sys.id} only after the user explicitly confirmed this recipe, or leave it out with --only.`
    : `Refusing ${p.body.sys.id}: payload has no editor check. Run build again.`).join('\n'), 2);
  // children before parents: a nested recipe must exist and be published before its parent is saved
  const ids = new Set(payloads.map(p => p.body.sys.id));
  const dependsOn = (p) => Object.values(p.body.resolvers || {}).filter(r => r.source === 'Contentful:DataAssembly').map(r => r.dataAssembly?.sys?.urn && typeIdFromUrn(r.dataAssembly.sys.urn)).filter(d => ids.has(d));
  const ordered = []; const seen = new Set();
  const visit = (p) => { if (seen.has(p.body.sys.id)) return; seen.add(p.body.sys.id); for (const d of dependsOn(p)) visit(payloads.find(x => x.body.sys.id === d)); ordered.push(p); };
  payloads.forEach(visit);

  const schema = await loadSchema(creds, join(outDir, 'api_log.jsonl'));

  const results = [];
  for (const { body, linkTo } of ordered) {
    const id = body.sys.id; const r = { id, linkTo: linkTo.map(t => `${t.kind}/${t.id}`) };
    const existing = await api.call('GET', `/data_assemblies/${id}`);
    const put = await api.call('PUT', `/data_assemblies/${id}`, { body, version: existing.ok ? existing.json.sys.version : undefined });
    r.save = existing.ok ? `updated (${put.status})` : `created (${put.status})`;
    if (!put.ok) { r.error = put.json.message; r.details = put.json.details?.errors?.map(e => e.message); results.push(r); continue; }
    let version = put.json.sys.version;
    if (!flag('--no-publish')) {
      const pub = await api.call('PUT', `/data_assemblies/${id}/published`, { version });
      r.publish = pub.status; if (!pub.ok) r.error = pub.json.message;
    }
    r.link = [];
    for (const t of linkTo) {
      const path = `/${t.kind === 'templates' ? 'experience_templates' : 'components'}/${t.id}`;
      const cur = await api.call('GET', path);
      if (!cur.ok) { r.link.push(`${t.id}: GET ${cur.status}`); continue; }
      const links = cur.json.dataAssemblies || [];
      if (links.some(l => typeIdFromUrn(l.sys.urn) === id)) { r.link.push(`${t.id}: already linked`); continue; }
      links.push({ sys: { type: 'ResourceLink', linkType: 'Contentful:DataAssembly', urn: `${EXPERIENCE_SOURCE}/dataAssemblies/${id}` } });
      const { sys, ...rest } = cur.json;
      const upd = await api.call('PUT', path, { body: { ...rest, dataAssemblies: links }, version: sys.version });
      r.link.push(`${t.id}: ${upd.ok ? 'linked' : 'FAILED ' + upd.status + ' ' + (upd.json.message || '')}`);
      if (upd.ok && sys.publishedVersion) r.link.push(`${t.id}: note — this ${t.kind.slice(0, -1)} has a published version that does not include the new link; publish it when ready`);
    }
    results.push(r);
  }

  // --publish-owners: publish the components/templates that offer the recipes, children first.
  // Publishing is bottom-up: a component cannot publish while a component in its tree or slot configuration
  // has unpublished changes, and a TypeRef property is checked against the CHILD's published binding sets,
  // so the child must be published (with its recipe linked) before the parent.
  const published = [];
  if (flag('--publish-owners')) {
    const all = (await api.list('/components')).items || [];
    const kids = (nodes, acc = new Set()) => { for (const n of nodes || []) { const u = (n.component || n.componentType)?.sys?.urn; if (u) acc.add(typeIdFromUrn(u)); for (const s of Object.values(n.slots || {})) kids(Array.isArray(s) ? s : [s], acc); if (n.componentTree) kids(n.componentTree, acc); } return acc; };
    const slotKids = (c) => (c.slots || []).flatMap(s => (s.allowedResources || []).flatMap(r => r.allowedTypes || []));
    const deps = Object.fromEntries(all.map(c => [c.sys.id, [...new Set([...kids(c.componentTree), ...slotKids(c)])]]));
    const wanted = [...new Set(ordered.flatMap(p => p.linkTo.filter(t => t.kind === 'components').map(t => t.id)))];
    const order = [], seen = new Set();
    const visit = (id) => { if (seen.has(id)) return; seen.add(id); for (const d of deps[id] || []) visit(d); order.push(id); };
    wanted.forEach(visit);
    for (const id of order) {
      const s = (await api.call('GET', `/components/${id}`)).json.sys;
      if (s.publishedVersion === s.version - 1) { published.push({ kind: 'components', id, result: 'already up to date' }); continue; }
      const pub = await api.call('PUT', `/components/${id}/published`, { version: s.version });
      published.push({ kind: 'components', id, result: pub.ok ? 'published' : 'FAILED ' + (pub.json.details?.errors?.map(e => e.message || e.details).join('; ') || pub.json.message) });
    }
    for (const t of ordered.flatMap(p => p.linkTo.filter(t => t.kind === 'templates'))) {
      const s = (await api.call('GET', `/experience_templates/${t.id}`)).json.sys;
      if (s.publishedVersion === s.version - 1) continue;
      const pub = await api.call('PUT', `/experience_templates/${t.id}/published`, { version: s.version });
      published.push({ kind: 'templates', id: t.id, result: pub.ok ? 'published' : 'FAILED ' + (pub.json.message || pub.status) });
    }
  }

  // verify
  const verify = [];
  const savedDas = Object.fromEntries(((await api.list('/data_assemblies')).items || []).map(d => [d.sys.id, d]));
  for (const { body, linkTo } of ordered) {
    const id = body.sys.id; const got = await api.call('GET', `/data_assemblies/${id}`);
    const v = { id, exists: got.ok, published: got.ok && !!got.json.sys.publishedVersion, upToDate: got.ok && got.json.sys.publishedVersion === got.json.sys.version - 1, linkedFrom: [] };
    // what the server stored is what the editor will load: check that, not the payload we sent
    if (got.ok) { const e = editorCheck(schema, got.json, savedDas); v.editableInUi = e.editable; v.editorState = e.state; v.editorCauses = e.causes; v.expectedApiOnly = allowApiOnly.includes(id); }
    for (const t of linkTo) { const o = await api.call('GET', `/${t.kind === 'templates' ? 'experience_templates' : 'components'}/${t.id}`); if (o.ok && (o.json.dataAssemblies || []).some(l => typeIdFromUrn(l.sys.urn) === id)) v.linkedFrom.push(t.id); }
    verify.push(v);
  }
  const surprise = verify.filter(v => v.editableInUi === false && !v.expectedApiOnly);
  const failed = results.filter(r => r.error).length + surprise.length + published.filter(p => p.result.startsWith('FAILED')).length;
  const outcome = {
    ok: !failed, at: new Date().toISOString(), results, publishedOwners: published,
    verify: verify.map(v => ({ ...v, state: !v.exists ? 'MISSING' : v.editableInUi ? 'editable in the component editor' : v.expectedApiOnly ? 'API only (confirmed by the user)' : 'API ONLY — NOT EXPECTED' })),
    problems: surprise.length ? [`${surprise.length} saved recipe(s) are API only although build found them editable: tell the user, and fix or remove them (${surprise.map(v => v.id).join(', ')}).`] : [],
    files: { report: join(outDir, 'apply.json'), apiLog: join(outDir, 'api_log.jsonl') },
    next: 'Ask the user to open each component in the component editor and confirm the new binding sets can be edited there.',
  };
  writeFileSync(join(outDir, 'apply.json'), JSON.stringify(outcome, null, 2));
  emit(outcome);
  return failed ? 1 : 0;
}
