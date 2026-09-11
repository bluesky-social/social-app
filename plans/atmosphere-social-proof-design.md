# Atmosphere social-proof design implementation preparation

## Status and operator instructions

Preparation and decision recording complete. All product questions, including
date headings, are resolved. The operator answered the implementation questions and
asked that the approach and compaction context be documented. This follow-up
changes only this plan and the seven pending task briefs; no implementation task
has started. **The recorded operator decisions below override earlier prototype
notes and proposals.** Keep continuation context here and individual tasks in
`AGENTS/tasks/`; work one at a time in numeric order. Ask about committing before
starting the next task, including preparation docs before task 0005. Never commit
without an explicit request. At most two delegates total, preferably inexpensive
models; one read-only Luna delegate completed the dependency audit (pane `%253`).
No second delegate was used.

Working tree was clean when preparation began. Current HEAD at inspection:
`839f8a42b Link color` (newer than the earlier route-rename handoff). Preserve all
subsequent operator changes.

## Sources examined

- `/Users/eric/Downloads/activity-feed-social-proof-design/README.md`.
- Entire 1,198-line `project/Activity Feed.dc.html` in that directory. The export
  contains four design iterations in reverse order, not a single unambiguous
  standalone instruction prompt.
- `plans/atmosphere-api-contract.md` in full. Its synchronization table is older
  than current frontend commits; rely on the detailed invariants and current
  code/schema, not its stale frontend-tip field.
- `lexicons/eric/bsky/atmosphere/getActivity.json`; byte-for-byte comparison to the
  backend worktree copy succeeded.
- `src/screens/Atmosphere/{types,model,presentation}.ts`, `renderers.tsx`,
  `index.tsx`, and `components/ActivityBodyContent.tsx`.

Do not render the exported prototype or screenshot it: its README explicitly
requests source inspection unless the operator asks otherwise. Actual running app
inspection through Argent is separate and allowed.

## Design interpretation (export reference; decisions below take precedence)

The chosen lineage is **2a -> 3a/3b -> 4a/4b**, not the discarded editorial
spotlight, colored rails, or colored verb chips in turn 1. Evidence:
`Activity Feed.dc.html:669-670` identifies the interleaved version as the one that
continued; turn 3 catalogs cases and repeat-subject behavior; turn 4 isolates
cards and runs of compact rows for final inspection.

- Content/title leads; actor/action/time becomes secondary metadata.
- Two presentations: prominent self-contained cards and subdued compact
  "footnotes", interleaved in API chronology. Nothing is globally re-ranked or
  hidden behind an activity bucket.
- Cards: active stream; high-signal recommendation cluster; standalone/grouped
  shares with actual post snippets; subscribed publication document; single
  photo; horizontal photo carousel; multiple subscriptions to one publication.
- Footnotes: low-signal recommendations; lone subscription; ended stream with
  duration; unsubscribed document with optional 40px thumbnail.
- Historical export: turn 2 specifies 3+ recommends and turn 3b shows two as a
  footnote. **Operator override: configurable thresholds defaulting to 2+ for
  both recommendations and subscriptions; no followed-author exception.**
- Repeat subjects at different times/pages stand alone; no "already shown"
  cross-reference, cross-page merging, or jump-back affordance.
- Final spacing example: 14px between adjacent cards; 24px between footnote runs
  and cards; compact rows have 8px separation plus faint separators inside runs.
- Dark mockup palette: feed `#111927`, card `#19222E`, card border `#2A3949`,
  internal divider `#232F3F`, strong text `#EEF2F6`, metadata `#8798B0` / `#667B99`.
  Production should map this hierarchy to ALF themes rather than hardcode a dark
  palette; light/dim/dark, dynamic type, and web widths still need support.
- Cards have 16px radius, around 13px vertical / 14px horizontal padding;
  article headings around 19px, compact card headings around 17px, copy around
  13px. Social avatars mostly 22-24px, snippet avatars 16px. Footnote icons 14px.
- Article card ordering in the latest iteration: publication/time/menu, title,
  preview, optional cover, optional social footer. Do not copy turn 2's earlier
  cover-before-title ordering by mistake.
- Mock media: recommendation cover 140px high; share thumbnail 66px square;
  live thumbnail 78px square; photo 230px high; carousel items 236x180 with 7px
  gap and "1 of N" indicator. **Operator override: reuse Gallery and lightbox
  as-is; exact mock carousel sizing/dots/count are not required.**

## Contract constraints and immediate implementation gaps

- Keep `$type` entry discrimination and API-provided `collection` dispatch.
- Preserve backend order, group boundaries, opaque keys/cursors, and attached
  related activity; never regroup by subject across pages.
- `associatedRecords` and `actors` are shared sidecar maps, not expanded records
  on every item. Keep `computedItemView` restricted to usable actor references
  and root-document subscription aggregation unless explicitly revisiting it.
- Continue omitting unhydrated/unusable actors; never show DID identities or
  invented placeholder people. Count usable distinct actors in visible social
  copy and promotion decisions; unavailable people do not count toward the
  threshold.
- Subscribed root documents are standalone; unsubscribed documents can be actor
  groups. Active streams without `endedAt` are standalone; ended streams can
  actor-group. Current renderer does not distinguish stream lifecycle.
- Frontend currently lacks an `app.bsky.feed.post` collection renderer and drops
  post-share children during related-activity narrowing. Backend contract already
  supplies standalone/subject-group/actor-group shares and document-related
  shares. Must implement all relevant boundaries, not just the card appearance.
- A share's sidecar is a complete raw post, not a hydrated `postView`. Resolve
  documents through direct external or record-with-media external
  `associatedRefs`; do not infer from free-text URLs. Do not fabricate post
  counts, moderation state, or a synthetic complete post view.
- Document text is at most 300 Unicode characters; full `content` is removed.
  Reading-time estimates cannot be derived honestly from this preview.
- No watching-friend list/count or full-network recommendation/subscription total
  exists in this response. Social proof is only the current returned cluster or
  related children. "6 friends watching now" is unsupported.
- `viewerState.subscribed` is meaningful only on root documents, always false on
  recommendation/subscription/share records. Do not misread a recommendation's
  `false` as the target publication being unsubscribed.
- Stream images must use `item.view.thumb` verbatim. Grain/document/publication
  blob URL resolution already exists. Missing images should leave no empty box.
- Remove the current standalone followed-author compact-card exception. Subject
  recommendation groups promote at the configurable default of two usable
  actors, independently of target-author follow state.
- Actor groups use a bounded first-API-item plus remaining count policy (photos
  are the gallery exception). Keep the first document's related activity, rather
  than selecting a later document for higher engagement.

## Dependency audit

Luna read `support.js`, `image-slot.js`, `ios-frame.jsx`, and the present design
system CSS/JS. The main agent additionally read `preview/_base.css` in full.
All referenced design-system files and nine Inter font files are present under
`project/_ds/bluesky-design-system-d53582a9-47ec-4d29-9235-fc6f27f0e86a/`.
No separate original conversation/prompt transcript was found; the README and
HTML's iteration notes are the prose handoff.

- `support.js` is generated Claude Design DOM/React/Babel/editor runtime, not
  application behavior. Do not port it.
- `image-slot.js` is a droppable/reframeable editor placeholder with WebP upload
  conversion, pan/zoom, placeholder/error states, and editor-side file
  persistence. These are not production feed requirements. Its fallback is
  fill-container/3:2; explicit HTML dimensions override that. Do not port upload,
  reframe, or prototype-placeholder behavior into feed media.
- `ios-frame.jsx` defaults to a 402x874 simulated device. The outer import hints
  say 414x886. Neither simulated status bar, keyboard, island, nor navigation is
  app UI to reproduce. Use actual app layout/safe areas.
- `_ds_bundle.js` exposes browser sample components and fake fixtures on `window`.
  Use real ALF, Link, Button, Menu, Typography, AvatarStack, and media components.
- `_base.css` supplies Inter fonts, border-box, 15px base text/1.3 line height;
  fixed preview `.card` dimensions do not govern the responsive app screen.

## Additional source audit and reuse boundaries

Read the generated `src/lexicons/eric/bsky/atmosphere/getActivity.defs.ts`, the
feature's `externalViews.ts`, `debug.ts`, `components/ActivityRelatedActivity.tsx`,
`components/ActivityHeader.tsx`, `components/ActivityPresentationRow.tsx`, shared
Standard Site embed and compact-card implementations, `RichText.tsx`, the public
Gallery implementation through its layout/index handling, and `ImageEmbed.tsx`.

- Generated sidecar output currently uses `l.lexMap()` despite the older contract
  saying `unknown`; the current local narrowing boundary remains useful.
- Share strong references are already in the app's generated
  `app.bsky.embed.external.External` schema (`external.defs.ts:88-121`). The full
  `app.bsky.feed.post` record schema also exists. No new backend field/schema is
  required just to support current shares. No generated raw Standard Site,
  Streamplace, or Grain record schemas were found in this repository; existing
  feature-local structural guards cover those records.
- Use `createDocumentExternalView` / `createPublicationExternalView` for current
  title, description, source, URL, cover/icon construction where useful. They do
  not populate `readingTime`. `getDocumentDescription` prefers description and
  otherwise the truncated text preview. Keep parsing used for relationship
  resolution separate from root collection dispatch.
- `StandardSiteEmbed`'s image-first article and publication/subscribe footer
  differ materially from the new content-first social-proof card. Prefer
  feature-owned composition rather than changing shared post/composer embeds
  globally. `StandardSiteCompactDocumentCard`'s menu is a useful pattern, not a
  reason to impose its entire layout on new cards.
- Document menu behavior to preserve: View publication, View author, Report this
  (reports the author account), with menu interactions independent of card links.
  New photo/stream/publication/share ellipsis menus have no defined action list
  in the prototype; do not render dead ellipses or invent unrelated actions.
- Existing `SubscribeButton` (`StandardSiteEmbed/index.tsx:432+`) is an external
  link, not a subscription mutation: recognized publishers say Subscribe on X;
  otherwise View publication. It validates custom theme contrast. The mock
  generic blue Subscribe button does not imply permission to implement a write
  operation or promise one-tap subscription.
- `RichText` accepts `RichTextAPI({text, facets})`, preserves valid mention/link/
  tag navigation, and handles RTL/emoji. Truncate via rendering, not substring
  manipulation that corrupts UTF-8 facet offsets. Keep snippet and article links
  separate; raw post data does not provide full moderation/hydrated post state.
  Existing ordinary post rendering calls `useModerationOpts` and `moderatePost`
  (`src/view/com/post/Post.tsx:53-71`). The operator explicitly accepts raw-sidecar
  snippets for this prototype: do not add post-view hydration, and retain a clear
  note that normal hydrated moderation equivalence is not provided.
- `Gallery` already has cross-platform pointer/keyboard/native handling, drawer
  gesture exclusion, nested scrolling, screen-reader fallback, alt controls,
  crop bounds, and optional metrics for real post contexts. It does NOT expose
  controlled current index or custom item dimensions through its public props.
  Its phone height is 200px, unlike the mock's 180px. The operator chose the
  existing Gallery UI, so no shared API extension/custom dots or dimensions are
  needed merely to match the mock. Adapt Grain data into the existing image
  shape and use existing defaults.
- `ImageEmbed` is the reusable lightbox integration reference. Atmosphere photos
  must not emit fabricated Bluesky post IDs/metrics.
- Existing row anatomy uniformly pads every row and truncates headers to two
  lines; it has no tier-sensitive spacing or date buckets. New footnotes must
  preserve accessible full text without pinning translated text to one line.
- `debug.ts` currently follows document/site, recommend/document, and
  subscription/publication only. Add share target traversal with coverage while
  preserving references, `?debug` web gating, and exactly one control per row.

## Real data and running-app evidence

Fetched three successive pages from the documented local authenticated endpoint,
using the response cursor verbatim. Raw responses are temporary research
artifacts (do not commit these):

- `/tmp/atmosphere-social-proof-research/page-1.json`: 17 outer rows.
- `/tmp/atmosphere-social-proof-research/page-2.json`: 13 outer rows.
- `/tmp/atmosphere-social-proof-research/page-3.json`: 52 outer rows.

Total: 82 outer rows, 169 direct root/group-child items, seven related
recommendations, and two related post shares. Coverage includes 20 standalone
documents (one subscribed), nine document actor groups, 12 standalone
recommendations, two recommendation subject groups, six recommendation actor
groups, 14 standalone subscriptions, four subscription subject groups, three
subscription actor groups, five standalone Grain photos, three standalone
streams without `endedAt`, three ended-stream actor groups, and one standalone
post share. No grouped shares or grouped Grain photos were observed in these
three pages; use deterministic fixtures for missing cases, not assumptions about
more live pages eventually supplying them.

Concrete examples:

1. Page 1, document
   `at://did:plc:lehcqqkwzcwvjvw66uthu5oq/site.standard.document/3mv6jew7jyc2v`
   (AtmosphereConf 2027 Organizing is Underway) is unsubscribed and has five
   recommendation children plus `renderg.host`'s share. Recommenders, in API
   order: bmann.ca, pds.dad, ronentk.me, tynanpurdy.com, sri.xyz. Their events span
   17:01-21:19 UTC, so they are NOT all "within an hour". The post is
   record-with-media, with external media targeting the document, a separate
   quoted post, and link/mention/tag facets. This is the key mixed-related test.
2. Page 1, document
   `at://did:plc:oio4hkxaop4ao4wz2pp3f4cr/site.standard.document/3mv6vbirgpk2d`
   (Experiments with agents) is unsubscribed and has one related post by its own
   author, mackuba.eu. Self-sharing should not be counted as additional friend
   endorsements without an explicit policy.
3. Page 1, standalone post
   `at://did:plc:dpajgwmnecpdyjyqzjzm6bnb/app.bsky.feed.post/3mv6xxs6q622t`
   by test.esb.lol has full commentary and a direct external embed referencing
   erlend.sh's Making software hurts now. The document is a separate root on a
   later page; do not merge them across pages.
4. Page 1 subscription subject groups have 5, 4, and 2 actors. There is a real
   two-person threshold edge, not just a hypothetical case.
5. Page 2, brookie.blog's a look out my window is a subscribed standalone
   document (`.../site.standard.document/3mr4n3yix4jmv`).
6. Page 3 has recommendation subject clusters of four (What's new?) and seven
   (Skyreader Vision), and document actor groups as large as 15. An actor
   subscription group has 10 publications; an ended-stream group has 13 streams.
   Unbounded child rendering would undo the intended density.
7. Page 1 iame.li's two streams have `createdAt`/`endedAt` and hydrated thumbs;
   page 3 robin.berjon.com's two ended streams have views without thumbs.
8. **Liveness caveat:** zeu.dev's page-2 stream lacks `endedAt`, but its raw
   `lastSeenAt` is 2026-09-10T02:15Z and `idleTimeoutSeconds` is 300. Page 3 also
   includes flo-bit.dev streams created in January with no `endedAt` (one last
   seen in April). The written contract calls all of these active. Blindly
   displaying LIVE NOW from absent `endedAt` can make a false real-time claim.
   The operator accepts this inaccuracy for now and requests a follow-up note
   to confirm lifecycle semantics. Do not add a frontend freshness timeout or
   block implementation on a backend change. Some older stream roots also have September
   `indexedAt` but much earlier raw `createdAt`, so distinguish feed timestamp
   from actual start/duration rather than assuming they coincide.
9. Grain payloads have blob, optional alt, aspect ratio, createdAt; these observed
   records have no display-caption field. Keep alt as alt, not visible caption
   copy invented from the prototype's fog/bridge example.

Argent used the already-booted iPhone 17 Pro simulator
`A8ADF8F1-F81E-4D34-BD1E-4F5110FACAD5`. Scrolled to the top then performed pull to
refresh. The returned UI added brittanyellich.com's fresh ATmosphereConf News
subscription above werd.io, proving refresh loaded fresh content. Final capture:
`/tmp/simserver-N0ltzc/media/811096000-1789082275825.png`. Left the app at the top
of Atmosphere. No app restart, account mutation, Metro restart, or prototype
render was performed. This is baseline inspection, not verification of a new
implementation. Device server remains in use for this ongoing session; scope
cleanup to this UDID when the session ends.

## Implementation boundaries

Keep the feature in `src/screens/Atmosphere/`; preserve `/atmosphere`, the current
header/back behavior, authenticated navigation, query transport, account cache
key, list loading/error/refresh/pagination lifecycle, and shared sidecar identity.
Do not resurrect Activity/ActivityV2 routes. Do not modify shared Standard Site
embeds as a shortcut to the new layout.

Use a small, pure presentation-kind decision helper if adjacent row spacing needs
it. Pass full item/context into collection renderers and construct their content
there. Do not expand `computedItemView` into a general view model. Display-kind
selection must agree with what actually renders after resolving usable records
and actors; skip missing content without phantom separators or headers.

Implement collection treatments behind the existing dispatcher, using common
card/footnote anatomy only where genuinely shared. Keep groups as one virtualized
row, cap child previews as approved, and preserve every child in data/debug output.
Decide date buckets and spacing from visible adjacent rows rather than nesting
entire runs in new non-virtualized lists. No cross-page semantic regrouping.

## Recorded operator decisions and concrete approach

The operator answered all six question groups and confirmed the calendar-heading
clarification. Implement these decisions instead of the historical export
thresholds or earlier unresolved task wording. No product questions remain open.

### D1. Configurable promotion, default two

Operator: "let's make it configurable, but use 2+ for both and no to the
following-author rule."

- Put independently named recommendation/subscription thresholds in one small
  feature-local config object, each defaulting to 2. No settings UI, persisted
  preference, remote feature flag, or new framework is needed. Allow tests to
  exercise another configured value without changing the rules' implementation.
- Count distinct hydrated usable actors, not raw records or avatar slots. One
  recommender/subscriber is a footnote; two promote under default configuration.
- Remove the followed-target-author exception completely. Following status may
  remain in sidecars but does not influence presentation.
- Root subscribed documents still get cards, as do photos, shares, and streams
  classified active under the accepted prototype lifecycle rule.

### D2. Related promotion and bounded actor groups

Operator approved promoting unsubscribed documents through related activity and
trusted the implementation recommendation for the remaining cases.

- The same configurable recommendation threshold applies to document-related
  recommendations. Any usable qualifying related share also promotes the
  document, independently of recommendation count.
- Choose **self-shares promote too** for this prototype: sharing adds actual
  post context, and treating it consistently is simpler than an exception. Name
  the real sharing author; never count their own share as an extra friend or
  combine the author/recommender/sharer into fabricated distinct people.
- Render one document card containing separate recommendation proof and share
  snippets. Do not duplicate the article and do not sum different verbs into a
  recommendation count. Deduplicate actor identity within each proof category.
- Actor groups across different subjects show the first API item/title (or
  first share/document preview) plus remaining count. Do not render all 15
  documents, imply multiple endorsers, or choose a later item for engagement.
  Preserve all children in data/debug. First-document-only related rendering
  remains intact even if a later document has stronger proof.
- Photos are the exception: a photo actor group uses Gallery rather than the
  first-only summary. Same-subject share groups use the snippet expansion below.

### D3. Metadata omissions, factual velocity, and date headings

Operator approved omitting unavailable metadata. Do not add reading time,
watching-friend counts, global-network proof totals, or the hardcoded follow
count. Count only returned evidence. A green momentum line may describe an
actual returned-cluster span when supported by its timestamps (e.g. four
recommendations within an hour); otherwise omit it. Never describe historical
activity as occurring in the current last hour or infer global velocity.

The operator explicitly confirmed this clarification ("Yep exactly that"):

- **Last 3 hours:** no heading. Keep the cutoff as a named constant/config value,
  not scattered literals.
- **Remaining items dated today:** Earlier today.
- **Yesterday:** Yesterday.
- **Older items:** localized dates.

The rolling recent window takes precedence over calendar headings, including
when it crosses midnight. Use API outer timestamps and local calendar math;
handle midnight, timezone/language changes, and empty sections without duplicate
or mislabeled headings. Keep chronology unchanged. This supersedes the earlier
ambiguous "prior to yesterday's date" wording; do not re-ask this question.

### D4. Raw post snippets and interactions are approved

Operator: "sounds good, and yeah raw-sidecar is fine for this prototype."

- Show at most two same-document post snippets initially. N more posts expands
  the remainder inline inside the same outer card; provide a matching collapse
  affordance without turning the whole card into an expansion target.
- Snippet interaction opens its Bluesky thread; article interaction opens the
  external article; actor links open profiles. Keep nested facet links and menu
  interactions independent. Actor groups spanning different documents retain
  first-preview plus count, not same-document social proof.
- Use raw sidecar text and real facets with existing RichText conventions. No
  extra post-view hydration/query path for this prototype. Empty text omits the
  quote box; never invent text or change byte offsets by slicing strings.
- **Accepted prototype limitation:** raw sidecars lack normal hydrated post
  moderation/server labels and viewer state. Document this limitation in code
  near the raw excerpt boundary and in these notes. Do not fabricate a complete
  postView, claim moderation equivalence, or quietly add hydration later.

### D5. Stream lifecycle limitation accepted, not a blocker

Operator: "keep using endedAt or duration to check, but leave a note to confirm
this, fine for now if it's incorrect."

- Use record completion information: present `endedAt` means ended; without
  completion evidence treat as active for now. Derive display duration only
  from valid raw start/end times, not root `indexedAt`.
- The currently documented/local structural type has no `duration` field, and
  the sampled streams did not expose one. If a real duration field is available
  during implementation, confirm its units and completion meaning from the raw
  schema before using it as an alternative end signal. Never use elapsed wall
  clock time or a made-up duration to declare completion.
- No backend change or lastSeenAt/idle-timeout freshness query is required now.
  Incorrect LIVE NOW for stale no-end records is explicitly accepted for this
  prototype. Preserve a code TODO and this follow-up: **confirm Streamplace
  endedAt/duration semantics and stale no-end handling with the backend before
  treating the display as reliable real-time liveness.**
- Ended actor groups retain the first title and total/remaining count; any
  displayed duration belongs explicitly to the shown stream, not the group.
- Use `item.view.thumb` verbatim and omit missing thumbs. Do not add watching
  proof, a video player, autoplay, or guessed replay URLs.

### D6. Existing Gallery/lightbox and functional controls

Operator: "use Gallery (fake anything not present) and lightbox, and don't worry
about exact carousel UI from the Claude prototype, just use what we have";
external subscription buttons and functional ellipsis menus were also approved.

- Reuse existing Gallery and lightbox behavior, dimensions, accessibility, and
  gestures. Do not add a custom carousel, dots/count UI, or shared-component
  sizing/index API merely to match Claude's mock.
- Adapt Grain records into Gallery's expected image view shape. For fields
  absent from raw Grain data, use safe adapter defaults (e.g. thumb = fullsize
  URL, alt = empty string, validated/fallback dimensions). This is the practical
  scope of "fake anything not present": no dependency on a hydrated Bluesky
  post view. Do not invent social counts/identities, actual image content,
  captions, or a post URI for metrics; metadata omissions from D3 still apply.
- Single photos use existing single-image/lightbox patterns; actor photo groups
  use Gallery in API order. Invalid/missing actual image blobs remain omitted.
- Keep alt as alt/accessible controls, not a fabricated visible caption.
- Subscription CTA opens the publication externally, using existing publisher
  recognition/fallback semantics. No in-app subscription mutation.
- Preserve the document menu (View publication, View author, Report this author
  account). New ellipses are only for real defined actions with resolvable
  targets; omit empty menus. Controls must not accidentally open the card link.

### Precedence and prototype follow-ups

- D1's default of two applies everywhere recommendations promote, including
  related recommendations; the original 3+ threshold is superseded.
- No target-author-follow rule, extra hydration, backend freshness work, or
  custom carousel should be introduced as "cleanup" during these tasks.
- Calendar headings are confirmed; no product clarifications remain. Accepted
  raw-snippet moderation and stream-liveness limitations are recorded follow-ups,
  not implementation blockers or requests for backend work.

## Verification plan

Each implementation task owns focused tests, with deterministic fixture cases
for unseen live combinations (especially photo groups and share groups). Keep
fixture records minimal/anonymized; do not commit the full live snapshots.

Coverage: configurable 1/2/3 recommendation threshold and override, proof that
following does not affect treatment, 1/2 subscription threshold and override,
mixed related activity, self-share promotion without duplicate people, repeated subject
across pages, actor groups with 15+ children, missing actors/images/records,
record-with-media facets, malformed references/dates, active/ended/missing-thumb
streams, stale no-end streams per approved policy, portrait/square/wide photos,
light/dim/dark, native/web interaction propagation, emoji/RTL/long titles, and
large text. Preserve query/account-switch/refresh/pagination/debug regressions.

Use only repo scripts: focused `pnpm test` (iOS default and Android preset),
`pnpm typecheck`, `pnpm lint`, `pnpm prettier`, and `git diff --check`. Do not run
intl extraction/compilation or invoke underlying test/lint/typecheck tools
directly. Actual UI checks via Argent should verify image/layout/navigation and
scroll behavior on iOS/Android and web. Load relevant Argent skills, record
repeatable paths before repeated interactions, and use fresh accessibility
frames for targeting. Do not claim unrun platform checks.

## Continuation checklist

1. Tasks 0005-0011 remain pending and are updated to D1-D6. No application files
   or historical tasks 0001-0004 have been changed.
2. All answers, including D3's calendar headings, are recorded. Do not re-ask
   resolved promotion, moderation, Gallery, or date-heading questions.
3. Before starting task 0005, ask whether to commit the preparation docs if the
   operator has not already committed them. Do not commit automatically. Mark
   only the current task in progress immediately before starting implementation.
4. Implement tasks serially in numeric order, updating this document and task
   status with actual verification evidence. Ask about committing between tasks.
5. Use at most one additional inexpensive delegate if needed (one Luna has
   already been used). Do not enable subdelegation. After compaction, re-read
   D1-D6, the current task, and git status before touching code.

## Pending task queue

| Number | Task | Main boundary |
| --- | --- | --- |
| 0005 | `AGENTS/tasks/0005-task-atmosphere-social-proof-data-rules.md` | Share narrowing/target traversal/debug; approved minimal presentation rules and tests |
| 0006 | `AGENTS/tasks/0006-task-atmosphere-content-first-articles.md` | Shared feature card/footnote anatomy, documents and recommendations |
| 0007 | `AGENTS/tasks/0007-task-atmosphere-subscription-social-proof.md` | Subscription cards/footnotes and external CTA semantics |
| 0008 | `AGENTS/tasks/0008-task-atmosphere-post-share-cards.md` | Standalone/grouped/related shares, mixed proof, safe snippets and interactions |
| 0009 | `AGENTS/tasks/0009-task-atmosphere-stream-lifecycle-cards.md` | Approved live-state policy, stream cards, ended summaries |
| 0010 | `AGENTS/tasks/0010-task-atmosphere-photo-card-galleries.md` | Photo cards, horizontal groups, media accessibility/interactions |
| 0011 | `AGENTS/tasks/0011-task-atmosphere-timeline-rhythm-verification.md` | Adjacent-row rhythm, approved date dividers, integrated regression/visual verification |

All seven are pending. Each includes context, approval gates, requirements,
constraints, verification, and definition of done. Earlier tasks 0001-0004 were
not modified. The operator may redirect this proposed sequence before work
begins; absent that, follow numeric order one at a time.

## Preparation verification

- `pnpm prettier`: passed (all matched files formatted); emitted the existing
  module-type warning for `prettier.config.ts`, not a formatting failure.
- `git diff --check`: passed for tracked diffs; there are no application diffs.
- `git status --short`: only the new untracked plan is listed. Task files exist
  with `status: pending`, but `AGENTS/` is ignored by
  `/Users/eric/.gitignore_global:23`. Do not force-add them or change ignore rules
  without an explicit request. They remain available locally for continuation.
- No tests/typechecks were run for this documentation-only preparation, and no
  implementation or commit was performed. One read-only Luna delegate was used.
