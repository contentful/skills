# Binding decision framework

Condensed from Contentful's "Binding Decision Framework for an External Agent" (reviewed 2026-10-21). Read this before proposing a binding design for any region whose editorial contract is not already obvious from existing binding sets. It is a planning framework; it does not grant permission to write.

## Operating principle

Start with the experience the **presentation editor** (creator) wants **experience editors** to have, not with matching similarly named fields.

> Preserve meaningful editorial choices. Remove accidental choices, repeated selections, and opportunities to contradict an intended content relationship.

"More flexible" is not better. "Fewer selections" is not better. The objective is the smallest authoring decision surface that still supports the creator's legitimate variations.

## 1. The editorial freedom contract

For each page or section establish:

| Dimension | Decision to establish |
|---|---|
| Structure | Fixed layout, controlled insertion points, or freely assembled modules? |
| Content identity | One governing subject, several independent subjects, or independently chosen content per module? |
| Relationships | Must a venue, author, image or legal notice come from the selected subject, or can editors replace it? |
| Multiplicity | Distinct named positions, or one presentation repeated over a list? |
| Selection ownership | Does the experience editor choose content, a content editor maintain a reference list, or a query determine membership? |
| Exceptions | Which deviations are legitimate, who may make them, through what explicit route? |
| Change | Who maintains the contract, and which experiences or shared modules depend on it? |

Summarise before recommending entities:

> Editors choose [independent inputs]. The system derives [related content]. Editors may vary [permitted dimensions]. It prevents [undesired inconsistencies]. Exceptions use [explicit route].

If intent is missing, state a provisional assumption and name the creator decision that would change the recommendation.

## 2. Keep the axes separate

- **Scope**: which page, section or component owns the content relationship?
- **Implementation**: coded or composed? Read the annotation. Coded does not mean atomic; templates can be coded.
- **Input design**: which decisions are independent, shared, or derived?
- **Recipe variation**: are there genuinely different ways to populate the same contract?
- **Repetition**: named instances or a collection of equivalent items?
- **Structural freedom**: can editors insert or reorder modules in slots?

Template → Composite → Coded is not a flexibility slider.

## 3. Where coordination belongs

> Coordinate content at its highest relevant semantic owner; keep reusable mappings at the lowest level where their meaning is stable.

| Scope | Prefer when | Editorial effect | Trade-off |
|---|---|---|---|
| Template | A page has a governing subject and stable cross-section relationships | Select the page subject once; derive what must agree with it | Page-specific coupling; exceptions need an explicit route; copying all mappings here undermines reuse |
| Composed component | Several components form a reusable semantic section | Configure one section instead of each visual element | A shared contract to maintain; avoid a generic wrapper with no semantic responsibility |
| Coded component | A reusable component has a stable content role independent of its parent | A mapping that can be fed independently or by a parent | Exposing every child input burdens editors; binding every primitive encodes meaningless contracts |

Nested recipes let a parent reuse a child's binding configuration instead of copying its resolution logic: that is how component-level reuse and parent-level coordination coexist. A binding on a coded component does **not** require a separate editor selection; the parent can feed it. Distinguish **mapping ownership** (where the recipe lives) from **selection ownership** (where its input comes from).

Do not invent a parent content type just to reduce selections. A parent entry should own a real editorial subject. A structural container can legitimately have no binding.

## 4. Parameters, binding sets, or allowed types

Ask in order:

| Question | Choice |
|---|---|
| Another independently variable input needed at the same time? | Add a **parameter** to the same set (`primaryPromotion`, `secondaryPromotion`) |
| The same subject used in several places? | Reuse **one input**; distribute its values |
| A relationship owned by the selected content? | **Derive** through a reference, don't ask again (Event → Venue) |
| Different content types fulfil the same role under compatible mappings? | **Multiple allowed types** on one parameter (Person or Speaker) |
| An alternative recipe with different inputs or relationship rules? | Another **binding set** (from Promotion, or from Product + Offer) |
| Another item in a repeated list? | A **collection**, not one set per item |

```
Binding set A OR binding set B     alternative recipes
Parameter A AND parameter B        inputs within the chosen recipe
Content type X OR content type Y   alternatives accepted by one input
One subject → many properties      shared input, not repeated selection
Collection → repeated item         multiplicity, not recipe alternatives
```

Rules: two independent entries of the same type need distinct inputs, not distinct sets. Different field names don't justify a new set if per-type mappings preserve the contract. Don't union unrelated types because their fields happen to be compatible. Create another set only when you can explain the recipe choice to its user. A parameter is an input contract, not necessarily a visible picker; a parent may supply it.

## 5. Static instances vs collections

| Pattern | Choose when | Control lives in | Trade-off |
|---|---|---|---|
| Individually bound instances | Positions have distinct meanings or need independent configuration | The experience's named selections | More authoring work, precise control |
| Reference-driven collection | Items share a presentation contract and membership belongs to a content entry | The source entry's reference list | Less assembly work; changing the list affects every consumer |
| Query-driven collection | Membership should follow a rule (latest eligible articles) | Query rules and any exposed controls | Less curation; results change without reselection |

"Three items" doesn't settle it: three named roles suggest positions, three interchangeable cards suit a collection with a limit. "Curated" doesn't mean "not a collection": a maintained reference list is curated and repeatable. A collection moves curation into a source entry; account for that work rather than claiming it disappeared. Define membership, ordering, limit, empty results, missing fields and publication behaviour. Do not assume authored reference order survives every resolution path.

## 6. Slots are not content inputs

Use a slot when the editor decides *which module* occupies a region, not *which entry* fills a known component. Slot occupants bring their own recipes; a template mapping cannot be the only binding model for unknown future occupants. Recommend structural freedom and content freedom independently. Don't use slots as a workaround for a binding problem.

## 7. Compare editorial consequences

For every recommendation say what becomes easier **and** what becomes impossible or more expensive:

| Candidate | Editor chooses | System derives | Gained | Removed / cost |
|---|---|---|---|---|
| Independently configured modules | Each module's subject | That module's fields | Arbitrary combinations | More selections; contradictory subjects possible |
| Governing page subject | One subject | Related sections from its references | Fast, consistent pages | Substitutions need an intentional exception |
| Reusable semantic section | A few section inputs | Internal visual elements | Reuse without remapping | A section contract to maintain |
| Collection-driven section | A source list or rule | Repeated items | Scalable, consistent items | Less per-item freedom; shared changes ripple |

Count independent decisions, not click totals. Reject a lower-selection design if it prevents a required variation. Reject a more flexible design if its extra choices have no legitimate use.

## 8. Capability and safety gates

1. Inspect existing templates, components, content model, binding sets and instance usage; reuse a valid contract before creating another.
2. Trace each input from source through the recipe to the exposed property and the rendered consumer.
3. Check types, requiredness, references, allowed types, nesting support and editor round-tripping. A schema-valid configuration is not proof of a maintainable editor workflow.
4. Collection restrictions: UI validation rejects Looper children with nested binding configurations and nested collection properties. Project item fields through a supported collection path, or mark the design blocked.
5. Test representative content, multiple instances, empty/partial data, switching recipes. Check editor and rendered output, not only API save success.
6. Review dependencies before altering a shared recipe.
7. Never create, delete, detach, remap or publish without explicit approval.

Since the 9 October 2026 release all content properties are public by default; inspect configurations rather than assuming older guidance.

## 9. Failure signals

| Signal | Ask |
|---|---|
| Many inputs point to the same subject | Legitimate choices, or repeated selections that should be shared or derived? |
| One parent input controls everything | What valid variation does this prevent? |
| A new parent content type is proposed | A durable editorial subject, or a mirror of today's layout? |
| Every coded primitive has its own entry | Is one editorial unit being fragmented? |
| A new binding set per item | Confusing recipe alternatives with simultaneous inputs? |
| A collection proposed only to reduce clicks | Do items share a contract and a membership owner? |
| A shared mapping copied into each template | Deliberate, and worth the maintenance? |
| A reusable section needs frequent special cases | Wrong contract, or variations not yet modelled? |

Two counterfactuals before finalising: **more rigid** (remove one choice: which legitimate task breaks?) and **more flexible** (add one choice: which real task becomes possible, which inconsistency appears?).

Finish each region with:

> Choose [pattern] because editors must control [variation] while [relationship] must remain consistent. This removes [redundant work], retains [required freedom], and moves [work] to [owner]. Reject [alternative] because [trade-off]. Implementation is [verified / provisional / blocked] for [reason].

## Worked decisions (abridged)

**Governed Event page.** One Event pick at the template; venue, legal notice and speakers derived through its references; coded components keep reusable mappings fed by the parent. Rigid: the editor can't substitute a venue. Rejected alternative: independent Event, Venue, Legal picks per page, because those combinations aren't legitimate choices.

**Campaign landing page.** Sections curated independently; a reusable Promotion Section owns image, heading, copy and link; each section gets its own promotion input; no Campaign type invented to centralise selections. Rejected alternative: derive everything from one page entry, because no editorial object owns the aggregate.

**Product comparison.** One binding set with `leftProduct` and `rightProduct` parameters. Not two binding sets, and not collapsed into one pick because the schemas match.

**Curated vs latest articles.** Curated: reference-driven collection owned by a content entry. Rules-based: query-driven with explicit eligibility, order and limit. Switching between them is two recipes; don't assume one child recipe can run per Looper item.

## Default recommendation

A governed hybrid: coordinate page identity at the template, keep stable component and section recipes for reuse, derive relationships that must stay consistent, expose only genuinely independent parameters, use collections for repeated semantic items. The creator's requirements and the environment's verified capabilities decide; the default is not a mandate.
