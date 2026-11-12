// propose: render the plan as a review page written for editors, not engineers. Reads <out-dir>/discovery.json
// and, if present, <out-dir>/build.json (validation + generated queries, shown collapsed). No network.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { flags, emit } from '../lib/cli.mjs';


export const usage = `propose --plan <plan.json> --out-dir <dir> [--title <text>]

Render the plan as proposal.html: a review page for the person who approves the binding sets.

  --plan <file>      the plan (references/plan-format.md)
  --out-dir <dir>    the working directory (needs discovery.json; uses build.json when present)
  --title <text>     page title (default "Binding proposal")

Writes <dir>/proposal.html and prints JSON with its path. No network access.`;

export async function run(argv) {
const { plan: planFile, 'out-dir': outDir, title = 'Binding proposal' } = flags(argv, { plan: { type: 'string' }, 'out-dir': { type: 'string' }, title: { type: 'string' } }, ['plan', 'out-dir']);
const plan = JSON.parse(readFileSync(planFile, 'utf8'));
const discovery = JSON.parse(readFileSync(join(outDir, 'discovery.json'), 'utf8'));
const build = existsSync(join(outDir, 'build.json')) ? JSON.parse(readFileSync(join(outDir, 'build.json'), 'utf8')) : null;
const owners = Object.fromEntries([...discovery.components, ...discovery.templates].map(s => [`${s.kind}/${s.id}`, s]));
// content model keyed by both PascalCase GraphQL name and content type id, so plans may use either
const ctByName = { ...discovery.contentModel, ...Object.fromEntries(Object.values(discovery.contentModel).map(c => [c.contentTypeId, c])) };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const human = (path) => path.replace(/CursorCollection\/items/g, ' (each item)').replace(/\/url$/, ' image URL').replace(/\//g, ' → ');
function fillsOf(recipe) {
  const out = [];
  const walk = (expr, target, prefix = '') => {
    if (typeof expr === 'string') { out.push({ target, path: prefix + expr }); return; }
    if (!expr || typeof expr !== 'object') { out.push({ target, path: `fixed value ${JSON.stringify(expr)}` }); return; }
    if ('$literal' in expr) { out.push({ target, path: `fixed value ${JSON.stringify(expr.$literal)}` }); return; }
    if ('$on' in expr) { for (const [t, sub] of Object.entries(expr.$on.type || {})) walk(sub, target, `${prefix}[when it is a ${ctByName[t]?.displayName || t}] `); return; }
    if ('$from' in expr) {
      const f = expr.$from; if (typeof f === 'string') { out.push({ target, path: `everything from ${f.replace('$resolvers/', 'child recipe ')}` }); return; }
      const src = (f.source || '').startsWith('$resolvers/') ? '' : (f.source ? f.source + '/' : '');
      if (f.select === undefined) { out.push({ target, path: prefix + (f.source || '').replace('$resolvers/', 'child recipe ') }); return; }
      walk(f.select, target, prefix + src); return;
    }
    for (const [k, v] of Object.entries(expr)) walk(v, `${target}.${k}`, prefix);
  };
  for (const [k, v] of Object.entries(recipe.return || {})) walk(v, k);
  return out;
}
const params = (p) => Array.isArray(p) ? p : Object.entries(p || {}).map(([id, x]) => ({ id, ...x }));

let cards = '';
for (const recipe of plan.recipes || []) {
  const targets = (recipe.linkTo || []).map(t => owners[`${t.kind}/${t.id}`]).filter(Boolean);
  const propName = (key) => { const [root, sub] = key.split('.'); const p = targets[0]?.contentProperties.find(x => x.id === root); return (p?.name || root) + (sub ? ` › ${sub}` : ''); };
  const b = build?.recipes.find(r => r.id === recipe.id);
  const rv = recipe.review || {};
  const picks = params(recipe.parameters).map(p => p.allowedTypes
    ? `<li><b>${esc(p.name || p.id)}</b> — one <i>${esc(p.allowedTypes.map(t => ctByName[t]?.displayName || t).join(' or '))}</i> entry${p.required === false ? ' (optional)' : ''}</li>`
    : `<li><b>${esc(p.name || p.id)}</b> — ${esc(p.type)}${p.fields ? ': ' + esc(p.fields.map(f => `${f.id}${f.fallbackValue !== undefined ? ' = ' + JSON.stringify(f.fallbackValue) : ''}`).join(', ')) : ''}${p.locked !== false && p.type === 'Record' ? ' (fixed, not editable per page)' : ''}</li>`);
  if (recipe.collection) picks.push(`<li><b>Nothing to pick</b> — items come from a query: ${esc(ctByName[recipe.collection.contentTypeName]?.displayName || recipe.collection.contentTypeName)}, ${recipe.collection.limit ? 'up to ' + esc(JSON.stringify(recipe.collection.limit)) + ', ' : ''}${recipe.collection.order ? 'ordered by ' + esc(recipe.collection.order.map(o => typeof o === 'string' ? o : `${o.path} ${String(o.direction).toLowerCase() === 'desc' ? 'newest first' : 'oldest first'}`).join(', ')) : 'default order'}</li>`);
  const fills = fillsOf(recipe).map(f => `<tr><td>${esc(propName(f.target))}</td><td>${esc(human(f.path))}</td><td class="note">${esc(rv.derived?.[f.target] || rv.derived?.[f.target.split('.')[0]] || '')}</td></tr>`).join('');
  const notUsed = Object.entries(rv.notUsed || {}).map(([k, why]) => `<li><b>${esc(propName(k))}</b> — ${esc(why)}</li>`).join('');
  const unfilled = targets.flatMap(t => t.contentProperties.filter(p => !(p.id in (recipe.return || {})) && !(rv.notUsed || {})[p.id]).map(p => `<li class="warn"><b>${esc(p.name)}</b>${p.required ? ' (required)' : ''} — not filled and not explained</li>`)).join('');
  const alts = (rv.alternatives || []).map(a => `<li>${esc(a)}</li>`).join('');
  const qs = (rv.questions || []).map(q => `<li>${esc(q)}</li>`).join('');
  const modifies = b?.modifiesExisting?.unchanged ? `<span class="pill">same as existing recipe “${esc(b.modifiesExisting.name)}”: nothing would change</span> ` : b?.modifiesExisting ? `<span class="pill warn">changes existing recipe “${esc(b.modifiesExisting.name)}”${b.modifiesExisting.published ? ' (published)' : ''}</span> ` : (discovery.existingBindingSets || []).some(d => d.id === recipe.id) ? `<span class="pill warn">changes an existing recipe</span> ` : '';
  const ed = b?.editor;
  const uiPill = !ed ? '' : ed.editable ? '<span class="pill ok">editable in the UI</span> ' : `<span class="pill bad">API only${ed.apiOnlyReason ? ' — needs your confirmation' : ''}</span> `;
  const apiOnlyBlock = ed && !ed.editable ? `<div class="apionly"><h3>API only: read-only in the component editor</h3><p>Editors will see this binding set but cannot review, change or remove it in the UI; every later change needs the API (or this skill). Why: </p><ul>${ed.causes.map(c => `<li><b>${esc(c.where)}</b> ${esc(c.why)}</li>`).join('')}</ul>${ed.apiOnlyReason ? `<p><b>Why we still propose it:</b> ${esc(ed.apiOnlyReason)}</p><p class="ask">Confirm explicitly if you want this. Otherwise we choose an editable design instead.</p>` : '<p class="ask">This will not be created as it stands. It needs an editable redesign, or your explicit agreement to an API-only recipe.</p>'}</div>` : '';
  const status = modifies + uiPill + (b ? (b.errors.length ? `<span class="pill bad">${b.errors.length} problem${b.errors.length > 1 ? 's' : ''}</span>` : `<span class="pill ok">validated against the schema</span>`) : `<span class="pill">not built yet</span>`);
  const issues = b ? [...b.errors.map(e => `<li class="bad">${esc(e)}</li>`), ...b.warnings.map(w => `<li class="warn">${esc(w)}</li>`)].join('') : '';
  cards += `
<section class="card" id="${esc(recipe.id)}">
  <header><h2>${esc(targets.map(t => t.name).join(', ') || '(no component)')} <small>${esc(targets.map(t => `${t.implementation.toLowerCase()} ${t.kind.slice(0, -1)}`).join(', '))}</small></h2>
  <div>Binding set <b>${esc(recipe.name || recipe.id)}</b> ${status}</div></header>
  ${rv.summary ? `<p class="summary">${esc(rv.summary)}</p>` : ''}
  ${apiOnlyBlock}
  <div class="cols">
    <div><h3>The editor picks</h3><ul>${picks.join('') || '<li>nothing — fully derived</li>'}</ul>${rv.picks ? `<p class="note">${esc(rv.picks)}</p>` : ''}</div>
    <div><h3>Filled automatically</h3><table><thead><tr><th>Property</th><th>Comes from</th><th></th></tr></thead><tbody>${fills}</tbody></table></div>
  </div>
  ${notUsed || unfilled ? `<h3>Left alone</h3><ul>${notUsed}${unfilled}</ul>` : ''}
  ${alts ? `<h3>Alternatives considered</h3><ul>${alts}</ul>` : ''}
  ${qs ? `<h3 class="ask">Questions for you</h3><ul class="ask">${qs}</ul>` : ''}
  ${issues ? `<h3>Validation</h3><ul>${issues}</ul>` : ''}
  ${b?.queries ? `<details><summary>Technical detail (generated queries)</summary><pre>${esc(Object.entries(b.queries).map(([k, q]) => `# ${k}\n${q}`).join('\n\n'))}</pre></details>` : ''}
</section>`;
}
// components and templates that could be bound but have no binding set, neither existing nor proposed here
const untouched = [...discovery.components, ...discovery.templates].filter(s => s.contentProperties.length && !(s.bindingSets || []).length && !(plan.recipes || []).some(r => (r.linkTo || []).some(t => t.id === s.id)));
const noProps = [...discovery.components, ...discovery.templates].filter(s => !s.contentProperties.length);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
:root{--bg:#fff;--fg:#1c1c1e;--muted:#6b6f76;--line:#e3e5e8;--ok:#1b7f3b;--bad:#b3261e;--warn:#9a6700;--ask:#2a5bd7;--card:#fafafa}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#111214;--fg:#e8e8ea;--muted:#9a9ea6;--line:#2a2d33;--card:#17181b;--ok:#4fbf72;--bad:#f28b82;--warn:#e3b341;--ask:#8ab4f8}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:1100px;margin-inline:auto}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:0}h2 small{color:var(--muted);font-weight:400;font-size:13px;margin-left:6px}h3{font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:18px 0 6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin:18px 0}
.card header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:10px}
.cols{display:grid;grid-template-columns:1fr 2fr;gap:20px}@media(max-width:760px){.cols{grid-template-columns:1fr}}
table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:500;font-size:13px}
ul{margin:0;padding-left:18px}li{margin:3px 0}.note{color:var(--muted);font-size:13px}.summary{font-size:16px;margin:12px 0 4px}
.pill{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}.pill.ok{color:var(--ok);border-color:var(--ok)}.pill.bad{color:var(--bad);border-color:var(--bad)}.pill.warn{color:var(--warn);border-color:var(--warn)}
li.bad{color:var(--bad)}li.warn{color:var(--warn)}.ask,ul.ask li{color:var(--ask)}
.apionly{border:1px solid var(--bad);border-radius:8px;padding:4px 14px 10px;margin:12px 0}.apionly h3{color:var(--bad)}
details{margin-top:12px}summary{cursor:pointer;color:var(--muted);font-size:13px}pre{font-size:12px;overflow:auto;background:var(--bg);border:1px solid var(--line);padding:10px;border-radius:6px}
.toc{columns:2;font-size:14px}@media(max-width:600px){.toc{columns:1}}
</style></head><body>
<h1>${esc(title)}</h1>
<p class="note">${esc(discovery.source.spaceId)} / ${esc(discovery.source.environmentId)} · ${(plan.recipes || []).length} binding set${(plan.recipes || []).length === 1 ? '' : 's'} proposed · nothing has been created yet</p>
${plan.intent ? `<section class="card"><h3>What we are enabling</h3><p class="summary">${esc(plan.intent.summary || '')}</p>${plan.intent.contract ? `<ul>${Object.entries(plan.intent.contract).map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul>` : ''}${plan.intent.assumptions?.length ? `<h3>Assumptions to confirm</h3><ul class="ask">${plan.intent.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}</section>` : ''}
<ul class="toc">${(plan.recipes || []).map(r => `<li><a href="#${esc(r.id)}">${esc((r.linkTo || []).map(t => owners[`${t.kind}/${t.id}`]?.name || t.id).join(', '))}</a> — ${esc(r.name || r.id)}</li>`).join('')}</ul>
${cards}
${untouched.length ? `<section class="card"><h3>Not part of this proposal: has content properties and no binding set yet</h3><ul>${untouched.map(s => `<li><b>${esc(s.name)}</b> (${esc(s.kind.slice(0, -1))}) — ${esc(s.contentProperties.map(p => p.name).join(', '))}</li>`).join('')}</ul></section>` : ''}
${noProps.length ? `<p class="note">Layout only, nothing to bind: ${esc(noProps.map(s => s.name).join(', '))}.</p>` : ''}
</body></html>`;
writeFileSync(join(outDir, 'proposal.html'), html);
emit({ ok: true, files: { proposal: join(outDir, 'proposal.html') }, next: 'Open the proposal for the user, or describe it, and wait for their decision.' });
}
