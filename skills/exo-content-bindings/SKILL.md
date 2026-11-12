---
name: exo-content-bindings
description: Design and create binding sets (content binding configuration, stored as Data Assemblies) for Contentful Experience Orchestration (ExO) components and templates, by working out with the user what editors should pick versus what the system should derive, then proposing, building, validating and publishing the recipes. Use this whenever someone wants to connect Contentful entries to ExO components or templates, "wire up", "bind", "hydrate" or "prebind" content, set up or review Binding Sets / Data Assemblies, add a query-driven or reference-driven collection, decide between template-level and component-level binding, or asks why a binding is set up the way it is. Also use it for indirect requests — "editors keep picking the wrong venue", "can the cards come from the section entry", "make this page one selection" — which are binding-design decisions. Not for building component trees or filling slots on an existing page (that is assembly), and not for choosing entries on a specific Experience (instance binding).
license: MIT
compatibility: Requires Node.js 20+ and an agent with shell access. Reading needs a Contentful CMA token with Experience Orchestration access; creating binding sets needs write access.
allowed-tools: Bash(node *) Read Write Edit
metadata:
  author: contentful
---

# ExO Content Bindings: binding configuration design

You help a **presentation editor** (the person who designs the authoring system) decide how ExO components and templates get their content, then you create the binding sets they approve. A binding set is a reusable recipe: it says what an **experience editor** picks when they place a component, and how everything else is filled from what they picked. The same component can offer several binding sets; the editor chooses one per instance.

The editor's experience is the product. Two recipes can fill the same properties and give editors completely different work: one asks for a section entry and derives the cards; another asks for the section and each card separately. Neither is right in general. The right one depends on whether those cards are a meaningful editorial choice on each page. You cannot read that off the schema. You have to ask, and you have to keep asking as you go, because the user's answers on one component usually tell you something about the next.

## What the platform calls things

Use the product's words so the user can find what you describe in the editor. ([Onboarding guide](https://www.contentful.com/help/experience-orchestration-onboarding-guide/))

| Say | Meaning | API name |
|---|---|---|
| **Binding configuration** | Designing a recipe in the component or template editor: allowed content types, which fields fill which content properties | Creating a **Data Assembly** |
| **Binding set** | One such recipe. A component can offer several | Data Assembly |
| **Binding** | An experience editor choosing a binding set and entries for one placed component | `contentBindings` on an Experience or Experience Fragment |
| **Component parameter** / editor pick | A selection the recipe asks the editor for | Data Assembly `parameter` |
| **Content property** | A named input on a component or template that receives content | `contentProperties[]` |
| **Design property** | An input that controls appearance, often constrained to design tokens | `designProperties[]`; never bound |
| **Presentation editor** | Designs components, templates and binding sets (your user) | |
| **Experience editor** | Assembles pages from them and does the binding | |
| **Content editor** | Maintains the entries that bindings read | |
| **Experience fragment** | A reusable, pre-assembled group of components | `experience_fragments` |
| **Template** | Page-level structure that governs Experiences; can carry binding sets too | `experience_templates` |

This skill works at the **binding configuration** layer. It never edits an Experience or Fragment. When a request is really about an instance ("fill the empty slots on the pricing page"), say so, explain that binding sets are the prerequisite, do that part, and name what remains for the experience editor.

## What you don't have to work out

The schema already answers several questions. Read them; don't infer them.

- **Content vs design.** A component definition lists `contentProperties` and `designProperties` separately. Only `contentProperties` are bindable. If something is in `contentProperties`, it *can* be bound; whether it *should* be is an intent question for the user (see `hideCta` below), not a classification you make.
- **Public surface.** Since the October 2026 release all content properties on a component are public. Composed components expose whatever their author hoisted into `contentProperties`; children inside the tree that weren't hoisted are not yours to reach. If a property the user needs isn't there, that's a component change, which is out of scope: say so.
- **Coded vs composed.** Read the `Contentful:CodedImplementation` / `Contentful:ComposedImplementation` annotation. Don't guess from the tree shape; coded components can have slots and templates can be coded.
- **Field types, requiredness, allowed types, GraphQL names.** `discover` reads them from the environment's GraphQL schema, which the Management API serves. Never derive a GraphQL name from a display label.
- **Query syntax and pointer syntax.** `build` generates them. You write *which field feeds which property*; the script writes the GraphQL and checks it against the schema.

## The conversation

Work region by region, not component by component in schema order. A "region" is an editorial responsibility: the hero, the proof section, the CTA band. Discover first, then for each region have a short exchange before proposing anything. The whole run is one conversation with checkpoints, not one plan dumped for sign-off.

### 1. Discover

`scripts/main.js` sits in this skill's directory beside `SKILL.md`. Resolve its absolute path and use it in every command below; `<workdir>` is a folder for this run's files. The script is self-contained: there is nothing to install. `node <skill>/scripts/main.js --help` lists the commands, and each command has its own `--help`. Every command prints one JSON document; messages go to stderr.

```bash
node <skill>/scripts/main.js discover --env-file <env-file> --out-dir <workdir>
```

`<env-file>` holds `CONTENTFUL_MANAGEMENT_TOKEN`, `EXO_SPACE_ID`, `EXO_ENVIRONMENT_ID` (or `CMA_TOKEN` / `SPACE_ID` / `ENVIRONMENT_ID`). Pass the file's path; never put a token in a command. Read-only. The JSON it prints has counts and file paths. **Read `<workdir>/discovery.md`**: it lists components and templates with their bindable properties, the content model with how often each field is actually filled, **every existing binding set in plain language**, and which fragments use them. The full data is in `<workdir>/discovery.json`.

This skill needs a shell and Node.js 20 or newer. Without them, say so and stop: binding sets written by hand through the API cannot be checked for whether the component editor can edit them, and that check is the point of the workflow.

`discover` also reports each component's publish state. "Not published at the moment (it was published before)" means someone unpublished it: editors cannot place it, or use any binding set on it, until it is published again. "Has unpublished changes" means editors still see the older published version. Either way, tell the user; publishing is their decision (see step 4).

If it fails with 401/403 that is a permissions problem (only space admins, or the Experience Editor / Presentation Editor roles, can see ExO entities), not an empty environment. Say that.

**Existing binding sets are house conventions.** Read every one before proposing anything. If an existing Quote recipe attributes quotes to `company`, that is an institutional decision ("quotes are attributed to the customer logo, not the person"), and you follow it unless the user says otherwise. Do not create a competing recipe for a component that already has one covering the same properties unless the user wants an alternative recipe; extend or reuse instead. Never describe anything as replaced or rewired.

An existing recipe marked **API ONLY** is one editors can see but cannot review, change or remove in the component editor. It still records a decision, so follow its *intent*, but don't copy its *shape*. Tell the user it is API only and offer an editable rebuild as a separate decision. Don't fold that into another change.

When an existing recipe **contradicts** something the user has told you, don't resolve it silently in either direction. Show both readings as the first question for that region: correct the existing recipe in place (same id and editor pick; every instance that already uses it changes), or add a second recipe beside it (editors then choose between two options that differ only in that one thing). Say which fragments select the recipe today; `discover` lists them. It does not read which binding sets the components placed on an Experience use, so don't tell the user that no page uses a recipe: say that fragments were checked and Experiences were not. `build` warns when a plan id matches an existing recipe and the proposal page badges it, but the decision is the user's.

### 2. Establish intent before entities

Ask the user, in their words, what editors are meant to be able to do. Then write the contract back to them in this shape and get a nod before touching a mapping:

> Editors choose **[independent inputs]**. The system derives **[related content]**. Editors may vary **[permitted dimensions]**. It prevents **[undesired inconsistencies]**. Exceptions go through **[explicit route]**.

If they don't know, make a provisional assumption, label it, and name the one decision that would change your recommendation. Don't silently pick maximum freedom or maximum rigidity. The full framework, with worked decisions, is in [references/decision-framework.md](references/decision-framework.md). The questions that most often change the design:

- **One governing subject or several?** Must the heading, items and image describe the same thing? If yes, one pick and derive the rest. If editors legitimately mix and match, keep separate picks even though it's more clicking.
- **Who owns membership of a list?** The experience editor (distinct named positions: separate picks), a content editor (a reference list on an entry: reference-driven collection), or a rule (latest N of a type: query-driven collection)? "Three cards" doesn't settle it; three *named roles* suggests positions, three *interchangeable* cards suggests a collection.
- **Does this relationship belong to the content?** An Event owns its venue. Derive it; don't ask again. A promotion panel's product is chosen per page. Ask.
- **Is this a different recipe or another input?** Two products compared side by side are two *parameters* in one binding set. "From a Promotion" vs "from the latest three Articles" are two *binding sets*. Same component, same properties, different editorial contract.
- **Where should coordination live?** Coordinate at the highest level where the relationship is stable (template for page identity, composed section for a reusable group), but keep the reusable mapping at the lowest level where its meaning holds, and have parents feed children through nested recipes rather than copying mappings. A plain layout container (Section, Columns) owns no binding.
- **Which content properties are intentionally editor-controlled?** A boolean like `hideCta` is a content property, so it can be bound. Whether to bind it depends on whether the *content* should decide it (the source entry has a `hideCta` field someone maintains) or the *editor* should flip it per placement. Ask. Don't classify it away.

Carry every answer forward. A constraint stated for the hero ("never let editors swap the logo") applies to the testimonial too unless they say otherwise.

### 3. Propose, one region at a time

Write the plan as `<workdir>/plan.json` (format in [references/plan-format.md](references/plan-format.md); a recipe as the API stores it, minus the queries, plus a `review` block of plain-language text), then:

```bash
node <skill>/scripts/main.js build --env-file <env-file> --plan <workdir>/plan.json --out-dir <workdir>   # validate against the live schema, generate payloads
node <skill>/scripts/main.js propose --plan <workdir>/plan.json --out-dir <workdir> --title "Title"       # proposal.html for the user
```

`build` prints, per recipe, its errors, warnings, what fills each property and whether the component editor can edit it; the full report is `<workdir>/build.json`.

`build` catches what the API would reject: fields that don't exist, type mismatches, a selection through a reference the schema types as a union without an `$on` branch (this applies even when only one content type is allowed; the script tells you), a required list with an unmapped member type, writing to a design property, and content properties left unfilled with no explanation. It also checks that the **component editor can edit** each recipe (below). Fix errors before showing the proposal. Nothing is written to Contentful by either script.

#### Keep every binding set editable in the UI

The Management API saves recipes that the component editor can only show as **API only**. Editors can see such a binding set but can't review, change or remove it there; every later change needs the API. The API response doesn't tell you which recipes these are. The editor decides when it loads the recipe, by its own editing rules. `build` checks every payload against those rules and names the part responsible. Without a declared reason an API-only recipe is an **error**, and `apply` refuses it.

The check is a copy of the editor's rules, tested against editor-authored and API-authored recipes, not the editor's own code. It can fall behind the editor. So the last word is the editor: after applying, ask the user to open the component and confirm each new binding set can be edited there.

An API-only result almost always means the design has an editable equivalent. Redesign first:

| API-only cause | Editable design |
|---|---|
| Takes the Nth item of a reference list (`…/items/0/…`) | Make each position its own editor pick (two parameters), or feed a nested recipe from a parameter |
| Fixed value (`$literal`) as a property | Leave the property unbound so the component's default applies, or fill it from a field |
| Hand-written GraphQL query / raw API resolver | Describe the resolver in the plan (`resolverType: "graphql"` from a parameter, `dataAssembly`, or the collection shorthand) and let `build` write the query |
| Selection deeper than 4 levels | Move part of the path into a nested recipe for the intermediate entry |
| Return reads `$parameters/…` directly | Read the picked entry through a resolver |

Only when no editable design meets the editorial contract, **stop and put it to the user as a decision of its own**, not as a line in the proposal:
- that this binding set will be read-only in the component editor, so later review, edits and removal all go through the API or this skill;
- the cause `build` reported, in plain words;
- the editable alternatives you considered and what each one cannot do;
- a direct question: build it as API only, accept the editable alternative, or drop it.

Only after they say yes in this conversation, add `"apiOnly": { "reason": "<what they agreed to and why>" }` to the recipe. Rebuild. The proposal then shows it with an "API only: needs your confirmation" block. At apply time pass `--allow-api-only <id>` for that recipe only. Never add `apiOnly` on your own judgment, and never use it to get past an error you could design around.

Everything `build` writes is in the shape the editor itself saves. An **existing** recipe can fit the editor's rules and still be in another shape (written through the API by hand or by an older tool). `discover` marks it "not written by the component editor": the editor should open it and would rewrite it on first save. Treat that as probably editable, not confirmed. Say so, and ask the user to check it opens in the component editor before you extend it or copy its convention.

Open `proposal.html` for the user (or describe it if you can't). It is written for editors: per binding set it shows **what the editor picks**, **what fills itself and from where**, **what was left alone and why**, **alternatives considered**, and **questions for you**. Generated queries are collapsed under "technical detail". Lead the conversation from the page, not from IDs. For each region, the user may approve, change a source, change who picks what, or ask for another recipe. Update `plan.json`, rebuild, re-render. Only when a region is settled move on.

Things that belong in the `review` block because the page is where the user sees them:
- `summary`: one sentence an experience editor would understand.
- `derived`: why a property comes from where it does when it isn't obvious (`author ← company: house convention, see existing Quote recipe`).
- `notUsed`: every bindable content property you deliberately didn't fill, with the reason. The validator refuses a required property that is unfilled and unexplained.
- `alternatives`: the nearest design you rejected and the trade-off. Say what becomes easier *and* what becomes impossible.
- `questions`: anything you assumed.

### 4. Apply only what was approved

```bash
node <skill>/scripts/main.js apply --env-file <env-file> --out-dir <workdir> --approved [--only <id,id>] [--no-publish] [--allow-api-only <id,id>]
```

Creates or updates each Data Assembly (children before parents), publishes it, adds it to the component or template that offers it, then reads everything back and reports saved / published / offered-by / **editable in the UI**. The last of these re-runs the editor check on what the server actually stored. It refuses to run without `--approved`; pass that flag only after the user approved the proposal, and only for the recipes they approved (`--only`). It also refuses any API-only payload not named in `--allow-api-only`. If a saved recipe turns out to be API only although the build found it editable, the run fails and says so. Tell the user, and fix or remove the recipe; don't leave it in place silently.

Linking a recipe changes the component, so editors keep seeing the old published component (without the new option) until it is published. Publishing is bottom-up: every component in the tree and in slot `allowedTypes` must be published first, and a `TypeRef` property is checked against the child's *published* binding sets. `--publish-owners` does this in the right order. Publishing components is a visible change for every editor in the environment, so offer it as a separate decision and don't do it unprompted.

**The API accepts recipes the editor cannot render.** Beyond the editability check, `build` guards two rendering cases found so far (a declared output that doesn't mirror the component's full contract; a `TypeRef` output pointing at a component type instead of the child recipe), but save-time acceptance is not proof the binding works. When an environment exists where the same component was bound through the UI, run `discover` against it and compare shapes before trusting a new pattern; after applying, ask the user to open the component in the editor.

### 5. Close the loop

Report in the user's terms: which binding sets now exist, whether each can be edited in the component editor (name any the user agreed to keep API only), what an experience editor will pick for each, what is still open (unhoisted properties, missing content, a region the user deferred), and what remains at the instance layer. Every API call the script makes is in `<workdir>/api_log.jsonl`; include counts and any failures. If you dry-ran anything or hit an API rejection, say what and how it was resolved.

## Patterns the scripts support

Full examples in [references/plan-format.md](references/plan-format.md).

| Need | Plan shape |
|---|---|
| Entry fields → properties | one parameter, `main` resolver, `select: "field"` or `"ref/field"` |
| Asset image | `"image/url"` (String properties take the URL; alt text from `description` only if the property is a Record) |
| Rich text | `select: "richField"` into a `RichText` property. The script adds the `document: json` alias. Warn the user that embedded entries/assets inside rich text are not rendered automatically; the component must handle them |
| Field on a referenced entry | `"author/name"`; if the schema types the reference as a union (it allows, or once allowed, more than one content type), `$on: { type: { Author: "name" } }`. `build` says which |
| List from a reference field | `source: "$resolvers/main/itemsCursorCollection/items"` with a select map; branch with `$on` per member type and map **every** type the field allows that exists in the environment |
| Latest N by rule | `collection: { contentTypeName, limit, order: [{ path: "sys.publishedAt", direction: "DESC" }] }`. Ordering is fixed in the recipe (the API currently rejects an editor-editable order). State membership, order, limit and empty-list behaviour in the review |
| Whole child component (`TypeRef` property) | nested recipe: `resolverType: "dataAssembly"` pointing at the child's binding set, fed from a parameter or from a parent field. The child must exist and be published first; list it earlier in the plan |
| Two independent picks of the same type | two parameters (`Basic Card 1`, `Basic Card 2`), not two binding sets |
| Same component, different source | a second binding set linked to the same component |
| Template-level coordination | same plan shape with `linkTo: [{ kind: "templates", id }]`; the template's own `contentProperties` are the targets |

Things the platform does not do, so don't promise them: picking "the Nth item" of a list (API only at best), per-value fallbacks (`description`, else `title`), reaching unhoisted child properties, preferring published over draft entries, preserving a reference list's authored order through every path (check before promising), nested bindings inside a Looper child.

## When something is rejected anyway

`build` validates against the schema, but the API is the authority. If a PUT returns 422, read `details.errors[].message`: it usually names the field or branch. Fix the plan, rebuild, re-apply only that recipe. Don't work around a validation error by weakening a type (e.g. RichText → String) without telling the user what they lose.

## Sources and provenance

Terminology and personas follow the ExO onboarding guide. The intent questions, the "coordinate high, reuse low" rule and the parameter-vs-binding-set distinction follow Contentful's binding decision framework ([references/decision-framework.md](references/decision-framework.md)). The script is one self-contained file; its only bundled dependency is the public `graphql` package (see `THIRD-PARTY-NOTICES.md`). The content model is read from the environment's GraphQL schema; queries and request bodies are generated and validated against that schema, in the shape the component editor saves, verified against a live environment in October and November 2026. The editability check is a copy of the editor's editing rules as of November 2026; where the schema and the API disagree (editable ordering), `build` follows the API. ExO is in a design-partner programme; re-verify against the current release notes when behaviour looks different.
