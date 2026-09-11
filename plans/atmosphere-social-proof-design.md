# Atmosphere social-proof design implementation preparation

## Status and operator instructions

Preparation and decisions are complete; all product questions are resolved.
The operator requested committing the plan and beginning work. Plan committed as
`8a3a70ec40fd`. **Tasks 0005-0010 are completed; implementation
is uncommitted. Task 0011 is in progress.** Photo galleries/lightboxes are capped at ten
usable images, per the operator's latest instruction; shared lightbox code is
unchanged. The photo path and repaired task-0008 mixed-share replay now pass;
see task 0010's evidence and remaining integration caveats below.
The operator subsequently said: "don't worry
about committing, just keep going - if you feel you need a checkpoint, commit it
and we can always squash it later." Continue serially without commit prompts;
checkpoint commits are explicitly authorized but not required. See completion
sections below for files, checks, and integration caveats. **Recorded product
decisions override historical prototype notes and proposals.** Keep continuation
context here and individual tasks in `AGENTS/tasks/`. Two delegate sessions were
created: read-only Luna dependency audit `%253` (now closed) and Luna article-card/
menu implementation `%254` (available and reused). The operator subsequently
reminded us that delegates can be created and reused; `%254` was reused for the
task 0007 review and task 0008 snippets. No subdelegation has been authorized.

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

## Contract constraints and gaps identified during preparation

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
- Latest operator decision after the 87-photo test: "do not support that many
  images, just cap it at 10, don't change the lightbox in any way." Cap the
  feature-local usable-image projection at ten, after validation, for both
  Gallery and lightbox. Preserve original group counts/children and sidecars;
  no shared lightbox, pager-dot, or Gallery changes.
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

1. Tasks 0005-0010 are completed; 0011 is in progress. Preparation plan
   commit: `8a3a70ec40fd`; implementation is uncommitted. Historical tasks
   0001-0004 were not changed.
2. All answers, including D3's calendar headings, are recorded. Do not re-ask
   resolved promotion, moderation, Gallery, or date-heading questions.
3. The operator authorized continuing without commit prompts and optional
   checkpoint commits. Mark only the current task in progress immediately before
   implementation; complete and verify it before the next one.
4. Work serially in numeric order, updating this document and task status with
   actual verification evidence. No implementation checkpoint has been made yet.
5. Reuse existing delegate `%254` as appropriate; the operator explicitly
   encouraged reuse. `%253` is closed. Do not enable subdelegation. After compaction, re-read D1-D6,
   the current task, and git status before touching code.

## Task queue

| Number | Task | Main boundary |
| --- | --- | --- |
| 0005 | `AGENTS/tasks/0005-task-atmosphere-social-proof-data-rules.md` | Share narrowing/target traversal/debug; approved minimal presentation rules and tests |
| 0006 | `AGENTS/tasks/0006-task-atmosphere-content-first-articles.md` | Shared feature card/footnote anatomy, documents and recommendations |
| 0007 | `AGENTS/tasks/0007-task-atmosphere-subscription-social-proof.md` | Subscription cards/footnotes and external CTA semantics |
| 0008 | `AGENTS/tasks/0008-task-atmosphere-post-share-cards.md` | Standalone/grouped/related shares, mixed proof, safe snippets and interactions |
| 0009 | `AGENTS/tasks/0009-task-atmosphere-stream-lifecycle-cards.md` | Approved live-state policy, stream cards, ended summaries |
| 0010 | `AGENTS/tasks/0010-task-atmosphere-photo-card-galleries.md` | Photo cards, horizontal groups, media accessibility/interactions |
| 0011 | `AGENTS/tasks/0011-task-atmosphere-timeline-rhythm-verification.md` | Adjacent-row rhythm, approved date dividers, integrated regression/visual verification |

Tasks 0005-0010 are completed; 0011 is in progress. Each includes context,
requirements, constraints, verification, and definition of done. Earlier tasks
0001-0004 were not modified. The operator may redirect this proposed sequence before work
begins; absent that, follow numeric order one at a time.

## Preparation verification

- `pnpm prettier`: passed (all matched files formatted); emitted the existing
  module-type warning for `prettier.config.ts`, not a formatting failure.
- `git diff --check`: passed for tracked diffs; there are no application diffs.
- `git status --short`: only the new untracked plan is listed. Task files exist
  with `status: pending`, but `AGENTS/` is ignored by
  `/Users/eric/.gitignore_global:23`. Do not force-add them or change ignore rules
  without an explicit request. They remain available locally for continuation.
- At the end of the original documentation-only preparation, no tests/typechecks
  or implementation had been performed. One read-only Luna delegate was used.
  Subsequent plan commit and task 0005 results are recorded below.

## Task 0005 completion and continuation details

### Implemented

- `src/screens/Atmosphere/config.ts`: independently configurable code-level
  recommendation/subscription thresholds, both defaulting to 2. Tests pass
  alternate configurations; no preferences UI or remote configuration added.
- `relationships.ts`: validates document strong refs using the generated
  `com.atproto.repo.strongRef` schema; reads direct external and record-with-media
  external targets only, ignores quoted post/free-text URLs, validates DID-owned
  document/rkey targets, and selects the first API child without reordering.
- `types.ts`: recognizes the share collection and preserves mixed recommendation
  and share children on documents, including grouped documents, without recursive
  related activity. Added `ShareRecord` excerpt fields and a structural guard
  that validates supplied facets. Raw post records remain the sidecar originals;
  no post-view hydration or moderation equivalence is introduced.
- `presentation.ts`: added `getActivityActor` returning the original usable actor.
  `computedItemView` still contains only normalized actors and root-document
  subscription aggregation.
- `socialProof.ts`: `getDocumentSocialProof` returns separate deduplicated
  recommenders and shares with original actor/activity references, checking
  relationship targets. `getActivityPresentationKind` implements approved
  signal-level rules, including configurable thresholds, no follow exception,
  related/self-share promotion, bounded actor-group policies, photo/share cards,
  and accepted endedAt-based stream state with a follow-up TODO.
- `debug.ts`: share -> document -> publication traversal, excluding quoted and
  unrelated sidecars while retaining included object references.
- `ActivityRelatedActivity.tsx`: explicitly filters to recommendations. This is
  necessary now that shares survive normalization; without it the old component
  would count and label sharers as recommenders.
- Tests added in `relationships.test.ts`, `socialProof.test.ts`, and expanded
  narrowing/debug/related-summary coverage. `testFixtures.ts` contains minimal
  synthetic record fixtures; no live snapshots were committed.

### Integration caveats at completion of task 0005 (superseded by 0006 below)

- **At this point the new signal helper was not yet wired into visual renderers.** Old cards,
  actor-first headers, and followed-author visual behavior remain until task
  0006 replaces those paths. Do not claim the new design is already visible.
- `getActivityPresentationKind` is a signal decision, not a full renderability
  check or cached view. Renderers must resolve valid content/URLs before actual
  layout so missing content does not leave phantom card spacing.
- The newly known share collection deliberately maps to `UnknownActivityRenderer`
  and `atmosphereUnknownRow` until task 0008 supplies the share card. Replace that
  mapping then, not with a temporary fabricated post view.
- `getDocumentSocialProof` validates share excerpt fields and relationships;
  invalid/missing actors or records do not promote a parent. A person can occur
  once in each separate proof category; never sum categories into a recommendation
  total. An author self-share promotes but is not an additional friend.
- Stream duration is not present in the inspected local type/sample; no made-up
  duration field or freshness timeout was added. Continue D5's accepted caveat.

### Verification and resolved issues

- `pnpm test --runInBand src/screens/Atmosphere`: **10 suites, 83 tests passed**
  on iOS.
- `pnpm test --preset jest-expo/android --runInBand src/screens/Atmosphere`:
  **10 suites, 83 tests passed** on Android.
- `pnpm typecheck`: iOS, Android, and web passed.
- `pnpm lint`, `pnpm prettier`, and `git diff --check`: passed. Existing Watchman
  recrawl and Prettier package-module-type warnings remain non-blocking.
- Initial strong-ref tests failed because the repository's manual
  `__mocks__/multiformats/cid.js` is an empty CID stub. The relevant suites use
  `jest.unmock('multiformats/cid')` so real schema validation is tested. Production
  validation was not weakened to satisfy mock behavior.
- Three old renderer tests expected hardcoded white text, invalidated by the
  operator's `839f8a42b Link color` commit. Updated five assertions to mocked
  theme text `#111111`; preserved `ActivityInlineLinkText.tsx` unchanged.
- A new accessibility test initially omitted the sanitization bidi markers;
  fixed it to compare `sanitizeHandle(...)` output rather than altering UI copy.
- Lint autofix also touched two unrelated suppressed type-only imports; those
  two tool-only edits were reverted precisely. Final source changes are confined
  to `src/screens/Atmosphere/` (plus this plan and the ignored task status).

### Argent evidence

Used the running iPhone 17 Pro simulator
`A8ADF8F1-F81E-4D34-BD1E-4F5110FACAD5`. The app was on Home; opened the native
drawer and tapped Atmosphere using fresh accessibility frames. Atmosphere loaded
current rows including `@aparker.io` and `@divy.zone` generic activity,
subscription cards, and a cameron.stream document; no error overlay appeared in
the returned screen. Final capture:
`/tmp/simserver-Ua8qOo/media/952959000-1789131337964.png`.

This was an iOS navigation/feed-load smoke check, not visual verification of
future card designs. The data/rule coverage is from focused tests. No Android/web
manual UI check or native debug-log inspection is claimed. The app is left at
the top of Atmosphere at that point. No additional delegate had been used yet.
The commit-prompt instruction was subsequently overridden by the operator; see
current status above.

## Task 0006 completion and continuation details

### Implementation

- Added feature-owned `components/ActivityPrimitives.tsx`: ALF card surface with
  16px radius and 13px/14px padding, quiet icon/title-first footnotes, muted linked
  actor/action/time lines, bounded 16px avatar stacks, and timestamps.
- Added `components/ArticleActivity.tsx`, which owns document/recommendation
  renderer boundaries, resolves actual views before deciding card renderability,
  applies task 0005's thresholds, preserves first-child actor-group previews and
  counts, and renders recommendation proof separately from publishing identity.
- Added `components/ArticleCard.tsx` and `DocumentMenu.tsx` (Luna `%254`). Source
  and activity time/menu precede title, preview, optional cover, and proof footer.
  Links are separate siblings, not one giant link wrapping menus/actor controls.
  Menu retains external publication, author profile, and author-account report.
- Added `getRecordActor` in `presentation.ts`; still no expanded computed view.
- Removed obsolete document body/target-author-follow helpers from renderers and
  `ActivityBodyContent.tsx`. Removed the now-unused `ActivityRelatedActivity`
  component/test; current proof rendering uses the stricter task 0005 helper.
- Replaced obsolete renderer expectations with the new matrix and retained
  dispatch, debug-reference, publication/subscription, Grain, and stream-thumb
  regressions. Added independent menu-target/account-report tests and updated
  screen tests for the new footnote copy.
- Shared `StandardSiteEmbed`, compact document embed, and post/composer cards are
  unchanged. Subscriptions, shares, streams, and photos still use their old
  visual treatments until their numbered tasks. Related share snippets are NOT
  rendered yet; preserved raw shares already promote document cards correctly.
- Global row adjacency/rhythm/date headings remain task 0011. Current article
  outer padding is `a.px_xl, a.py_sm`; card/footnote primitives do not reorder rows.

### Checks

- iOS: `pnpm test --runInBand src/screens/Atmosphere`: 10 suites / 98 tests passed.
- Android: `pnpm test --preset jest-expo/android --runInBand src/screens/Atmosphere`:
  10 suites / 98 tests passed.
- `pnpm typecheck` (iOS/Android/web), `pnpm lint`, `pnpm prettier`, and
  `git diff --check` passed. Existing Watchman and Prettier module-type warnings.
- Initial new test fixtures omitted recommendation `createdAt`; corrected the
  fixtures rather than weakening production guards. Inline title+suffix tests
  use combined text matching. Menu mock's local uppercase Container triggered
  React Compiler/Jest `_c` hoisting; inline mock fields fixed it. Mocked DotGrid
  to avoid loading the entire ALF/dialog app graph in the isolated menu suite.
- No lint autofix was run across unrelated source files in task 0006. Scoped
  Prettier used a temporary root ignore file, which was removed afterward.

### Live iOS evidence and replay

Device remains iPhone 17 Pro `A8ADF8F1-F81E-4D34-BD1E-4F5110FACAD5`, app
`xyz.blueskyweb.app`. Argent restarted it once to enable native-devtools
instrumentation required by the flow runner. No Metro restart, account mutation,
prototype export render, or reporting submission occurred.

Observed:

- Chris Coyier's new article and mackuba.eu's "Experiments with agents" render as
  cards due to related self-shares, while their root `subscribed` is false.
- Brookie's subscribed "a look out my window" gets an article card.
- Two-person recommendation subject group "An open letter to Bluesky Social
  PBC..." gets a card with `@brookie.blog and 1 other recommended`.
- cameron.stream/werd.io/scripting.com documents and a tynanpurdy.com lone
  recommendation render as compact title-first footnotes with separate actor
  links and menus.
- Real mixed document "AtmosphereConf 2027 Organizing is Underway" gets one card
  with publishing identity and six recommender actors; UI correctly shows
  `@chadkoh.com and 5 others recommended`. renderg.host's related share is
  preserved but not added to that recommendation total.
- Article menu -> View author opened the correct Chris Coyier profile after
  closing the native menu; article navigation was not accidentally triggered.

Latest sampled live response: `/tmp/atmosphere-task6-live.json` (do not commit).
Conf now has chadkoh.com, bmann.ca, pds.dad, ronentk.me, tynanpurdy.com, sri.xyz
recommendations plus renderg.host's share. The original preparation sample had
only five recommenders; count the current returned data, not that stale sample.

Saved recorded/replayed fragments:

- `.argent/flows/atmosphere-article-menu-task6.yaml`: Home -> drawer -> Atmosphere
  -> document menu -> author profile. Full replay passed 13 executable steps.
- `.argent/flows/atmosphere-related-proof-task6.yaml`: from Atmosphere top, scroll
  to native `atmosphereArticleRecommendations` and verify visible recommendation
  copy. Full retry passed both executable steps.
- `/tmp/atmosphere-open-task6.yaml`: verified prefix of the first flow, useful to
  stage Atmosphere from signed-in Home without opening a menu. Seven steps pass.

Flow caveats and repairs:

- Before injection, tap capture had no runner tree. Restarting the app fixed it.
- One captured drawer tap incorrectly targeted `userAvatarImage` and navigated
  to the operator's profile. Restored Home and re-recorded the actual drawer
  control; removed the bad capture and failed wait only after finishing.
- Some captures kept points or wrong iOS roles. Polished to strict source-backed
  ids/text and proved the complete replay; no raw point remains in saved flows.
- The title's AX `StaticText` role differs from the native runner role. Its live
  `await-ui-element` stays raw in the menu flow; a native menu-id gate follows.
- UITextView exposes `atmosphereArticleRecommendations` in the native hierarchy
  but not AX. `native-find-views` confirmed the visible native id and window
  frame. Recorded a successful visible `recommended` text check, converted the
  element-seeking swipes to native-id `scroll-to`, and replayed successfully.
  Original recorder output is preserved in `/tmp/atmosphere-*-recorded.yaml`.
- Flows are data-dependent local fragments, not deterministic CI QA acceptance
  suites. They declare prerequisites and have no screenshot baselines or scripts.

Screenshots:

- Initial self-share card: `/tmp/simserver-Ua8qOo/media/731170000-1789132950744.png`
- Menu: `/tmp/simserver-Ua8qOo/media/920454000-1789133008937.png`
- Correct author profile: `/tmp/simserver-Ua8qOo/media/733854000-1789133048747.png`
- Subscribed card/footnote: `/tmp/simserver-Ua8qOo/media/977510000-1789133373990.png`
- Two-person recommendation card: `/tmp/simserver-Ua8qOo/media/806226000-1789133388821.png`
- Mixed card, initial inspection: `/tmp/simserver-Ua8qOo/media/442378000-1789133517458.png`
- Mixed card, successful retry: `/tmp/simserver-Ua8qOo/media/839486000-1789136283851.png`

The later retry showed a pre-existing Home/app network-error LogBox banner
(`XrpcFetchError ... Internet connection appears to be offline`). The local
Atmosphere endpoint returned HTTP 200 and both replayed paths passed. The banner
was not investigated or attributed to a specific request; do not claim clean
runtime logs. It overlays the bottom tab bar, so dismiss it through UI before
any bottom-target interaction. The app is currently scrolled to the mixed
AtmosphereConf document (about 57%). No Android/web manual UI, dark-theme,
large-text, or visual-diff acceptance is claimed yet.

At completion of task 0006, both initial delegates had been used and task 0007
was next. No implementation commit had been made. The operator explicitly said
to continue without commit prompts and permitted checkpoint commits if useful.

## Task 0007 completion and continuation details

### Implementation

- New `components/SubscriptionActivity.tsx` replaces the old subscription
  renderer with feature-owned publication cards and title-first footnotes.
  Default-two distinct usable subscribers and threshold overrides use the
  centralized signal rules; actor groups remain first-publication-plus-count
  footnotes without hidden-child substitution or invented subscriber counts.
- Cards use actual optional icons, title/domain, optional author/description,
  outer timestamp, bounded subscriber proof, and independent publication,
  profile, menu, and CTA controls. Invalid URLs cannot create cards or CTAs.
- Reuses the unchanged shared `SubscribeButton`, preserving real publisher
  recognition, contrast-safe styling, and external Subscribe/View publication
  behavior. No subscription or viewer-state mutation was added.
- Reused Luna delegate `%254` for a read-only review. It caught an invalid-URL
  fallback that unnecessarily hid known-author menu actions. Fixed by allowing
  `DocumentMenu` to accept an absent external view and retaining author-only
  menus in subscription and article footnotes. Publication navigation stays
  disabled without a valid source URI; author navigation/reporting still work.
  The delegate rechecked the fix and reported no blocking findings.
- Regression coverage includes 1/2/3 subscriber boundaries and overrides,
  duplicate/unusable actors, bounded avatars, ten-publication actor groups,
  missing first records, actual/missing media and authors, invalid URLs,
  author-only menus, long RTL/emoji names, and real publisher/CTA view data.
  Renderer tests mock the CTA but verify the actual view/theme passed to the
  existing implementation; author/report behavior has independent menu tests.

### Verification

- Final iOS and Android runs each passed **14 suites / 138 tests**, including
  Atmosphere plus retained route, route-helper, drawer, and shared compact-card
  regressions. Logs: `/tmp/atmosphere-task7-ios-final.log` and
  `/tmp/atmosphere-task7-android-final.log`.
- `pnpm typecheck` passed iOS, Android, and web; `pnpm lint` passed.
  `pnpm prettier` initially identified the new conditional's formatting; after
  the formatting-only fix, Prettier and `git diff --check` passed.
- Live iOS screenshot review showed a single `matthieu.bsky.team` subscription
  as a footnote and the `natemoo.re` plus one-other subject cluster as an
  ATmosphereConf News card with real icon, domain, author, description, proof,
  and View publication CTA. Capture:
  `/tmp/simserver-Ua8qOo/media/988390000-1789137159000.png`.
- Recorded/polished/replayed
  `.argent/flows/atmosphere-subscription-cta-task7.yaml`: **9 executable steps
  passed**, no failures/errors/skips (11 total including echoes). It locates
  the native CTA ID, opens the existing external-link browser-choice dialog,
  cancels, and proves the dialog disappeared and publication controls returned.
  This preserves the unset browser preference and does not subscribe.
- One idle gate warned that a small screen region was still moving. Explicit
  prompt-visible, Cancel, prompt-hidden, and returned-control gates all passed;
  the warning's motion source was not identified. This is a data-dependent
  local fragment, not a deterministic CI acceptance suite.
- The destination website itself was **not** opened: the browser-choice prompt
  was cancelled rather than changing the user's preference. Android/web manual
  UI, dark-theme, and large-text checks remain unclaimed.

### Runtime connection recovery

The simulator had returned to the Expo launcher and the discovered LAN Metro URL
would not load the app. Existing Metro PID 84205 on port 8081 was confirmed to use
this worktree. Opening
`bluesky://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081`
and accepting the system Open prompt downloaded the bundle and restored the
signed-in app. Debugger status confirmed this worktree and the iPhone target.
Only this simulator's app was restarted; Metro was not restarted and the
simulator was not rebooted. The existing Home-to-Atmosphere fragment replayed
successfully after recovery.

At task 0007 completion, shares still used the generic renderer. Task 0008
replaced that treatment as documented below. No implementation checkpoint
commit has been made.

## Task 0008 implementation and verification

- Reused Luna `%254` for `components/ShareSnippets.tsx` and its tests; source
  and tests have been handed back. Parent reviewed the integration and extended
  tests. Luna also made early share-renderer wiring/composition edits before
  parent integration; no source ownership remains outstanding. No subdelegation.
- Parent added `components/ShareActivity.tsx`: API-collection share dispatch,
  one compact document preview, independent document menu, separate real sharer
  header, and snippets. Subject groups retain valid matching posts (deduplicated
  by post URI) and count distinct usable people separately. Actor groups stay
  first-share/preview plus remaining-post count. Invalid/missing content falls
  back without invented excerpts/media. Shared sidecars and original references
  remain intact.
- `ArticleActivity.tsx` now includes selected related shares in the one parent
  article card, separately from publisher and recommendation lines. Only the
  first document's related children render in actor groups. Existing malformed
  article/external-view fallback remains intact.
- `relationships.ts` adds `getSharePostHref(activity, actor)` for actual-owner
  post-thread links. `socialProof.ts` now rejects share sources that cannot form
  a real owned post-thread link; existing related actor deduplication remains.
- Parent renderer/relationship/social-proof tests cover root/mixed/self shares,
  original references, distinct people versus posts, invalid sources/targets,
  first-only actor groups, missing/unsafe article targets, and actual covers.
  Snippet rendering is mocked in composition/list tests; delegate owns actual
  excerpt/expansion/interaction tests.
- Intermediate parent checks passed **10 iOS suites / 129 tests**, all-platform
  typechecks and lint. This is not final task verification: the delegate is
  still refining snippets. Initial failures were a nested footnote text query,
  list-test imports pulling real RichText infrastructure, and mock stringifying
  unknown data; fixed with anchored matching, a focused snippet mock, and a
  string type check. Production guards were not weakened.
- Working scoped Prettier ignore pattern is `*`, then `!*/`, then explicit file
  negations, in a temporary repository-root ignore file. `**/*` plus only file
  negations silently matches no files. The working command fixed four parent
  files and the temporary ignore file was removed.
- New read-only live snapshots (do not commit): `/tmp/atmosphere-task8-live.json`,
  `/tmp/atmosphere-task8-live-2.json`, `/tmp/atmosphere-task8-live-3.json`.
  Three inspected pages contain 20/12/52 outer rows. First-page standalone
  shares include `aparker.io` (CSS resets), `divy.zone` (atproto spaces), and
  `test.esb.lol` (Making software hurts now); related shares include Chris
  Coyier's self-share, mackuba.eu's self-share, and renderg.host's conference
  post with real tag/mention/link facets. No grouped shares were observed.
- `ShareSnippets` initially shows two usable posts, with translated expansion
  and collapse. Empty text retains thread access without a quote box. Complete
  raw text/facets enter RichTextAPI unchanged, with a four-line display cap.
  Short facet-free emoji uses a locally capped Text; long emoji already goes
  through RichText's capped normal branch (`isOnlyEmoji` has a length limit).
  The delegate's initial long-emoji test assumption was corrected, not worked
  around in production code. Mention/tag/link UTF-8 offsets and original facet
  references are covered, including emoji before the facets.
- Quote bodies use a link-role Button without href, avoiding nested web anchors.
  Facet events prevent the parent thread action; profile, document preview,
  and menu targets stay independent. The raw-sidecar boundary explicitly notes
  the absence of hydrated moderation, server labels, and viewer state.

### Final automated verification

- iOS and Android each passed **15 suites / 162 tests**, including Atmosphere,
  routes, route helpers, drawer, and the unchanged shared compact-card regressions.
  Logs: `/tmp/atmosphere-task8-ios-final.log` and
  `/tmp/atmosphere-task8-android-final.log`.
- `pnpm typecheck` passed all three platforms; `pnpm lint` and `pnpm prettier`
  passed. Logs: `/tmp/atmosphere-task8-{types,lint,prettier}-final.log`.
  Restored two unrelated type-import edits in KnownLikers and merge.test.
- Grouped shares/expansion, malformed data, self-shares, mixed categories,
  bounded actor groups, and missing-content cases have deterministic coverage.
  No grouped shares were available in the inspected live data.

### Actual iOS verification and saved fragments

- Reviewed the live light-theme card screenshots: Chris Coyier's self-share
  inside its article; aparker.io's standalone quote and compact CSS article;
  and the conference article with one publisher line, six recommenders
  (`@chadkoh.com and 5 others recommended`), and renderg.host's separate quote.
  Mixed-card capture: `/tmp/simserver-Ua8qOo/media/657341000-1789141656664.png`.
- `.argent/flows/atmosphere-share-thread-task8.yaml` replay passed **5 steps**;
  the standalone quote opened the aparker.io post, not the article.
- `.argent/flows/atmosphere-share-article-menu-task8.yaml` replay passed
  **15 executable steps**: the article entered the external-link browser-choice
  path, Cancel returned to the card, and View author opened vale.rocks.
  One idle gate reported small unidentified motion; visible-returned-preview
  and stable menu/destination controls passed. The external site was not loaded,
  browser preference was not changed, and no report/subscription was submitted.
- A separate sharer-handle tap opened austin's aparker.io profile, independently
  of the document author. Capture:
  `/tmp/simserver-Ua8qOo/media/275483000-1789141513287.png`.
- The mixed card's quote opened the actual renderg.host thread (captured at
  `/tmp/simserver-Ua8qOo/media/749310000-1789142056761.png`). Returning to the
  card and tapping its nested `@gui.do` facet opened Guido X Jansen's profile,
  not the parent thread. Capture:
  `/tmp/simserver-Ua8qOo/media/312524000-1789142113318.png`.
- `.argent/flows/atmosphere-mixed-share-task8.yaml` preserves the recorded
  mixed-card path and a native-verified scoped quote selector. **Its final full
  replay is not proven.** It failed at the nested recommendation scroll target
  after 25 attempts. Subsequent inspection found new live activity at the top:
  a subscription followed by j4ck.xyz's **87-photo actor group**, currently
  rendered as an unbounded vertical stack by the old photo renderer. This also
  invalidated the old navigation fragment's assumption of a document menu in
  the first viewport. Capture:
  `/tmp/simserver-Ua8qOo/media/810508000-1789142268816.png`.
  The earlier starting-position suspicion was not the demonstrated cause;
  changed live data and the old photo layout explain the scroll-limit failure.
  Revisit this data-dependent fragment after task 0010's bounded Gallery work;
  do not call it a passing regression test. Manual mixed-share evidence above
  remains valid. No checks were weakened to hide the failure.
- These are data-dependent local fragments, not deterministic CI QA suites.
  Android/web manual UI, dark themes, large text, and on-device grouped-share
  expansion remain unclaimed. Task 0011 retains cross-platform integration QA.

Task 0008's implementation, automated coverage, and actual share interactions
are complete. The optional mixed-fragment replay limitation is retained above
for integration follow-up.

## Task 0009 implementation and verification

### Implementation

- Added `components/StreamActivity.tsx`: active standalone cards have translated
  LIVE NOW status, outer activity time, title, independent streamer/profile link,
  and an optional 78px-square appview thumbnail. No watching counts, player,
  autoplay, guessed replay URL, or nonfunctional menu is rendered.
- Ended streams are title-first footnotes. Actor groups show only the first
  title plus remaining count, and explicitly label duration as belonging to the
  first stream. All original children/sidecars remain available to data/debug.
  Missing first records do not select later content. Unexpected active actor
  groups remain bounded summaries rather than implying the whole group is live.
- `streams.ts` centralizes present-endedAt versus absent-endedAt classification,
  finite ordered raw lifecycle duration, and credential-free absolute HTTP(S)
  URL validation. `socialProof.ts` uses the same status helper. Even empty or
  invalid end strings mean ended, but have no duration. No freshness timeout,
  lastSeenAt policy, invented duration field, or liveness query was added.
- Durations use Lingui number/unit formatting (seconds below a minute, otherwise
  whole elapsed minutes); outer indexedAt remains the feed timestamp. Tests
  verify locale changes update units. `isLivestreamRecord` now validates optional
  fields and a present discriminator, tolerating invalid date strings safely.
- Removed the obsolete unbounded `LivestreamBody`. Images use only the first
  item's typed `view.thumb`, verbatim, with lazy loading. Missing/blank thumbs
  produce no image frame; raw blob fields are never used as a fallback.
- Reused Luna `%254` for helpers/guard/tests; parent owns final integration.
  A plain tmux buffer paste split the brief into separate prompts and initially
  put helpers in socialProof.ts. Corrected by sending a single-line instruction
  to read the complete brief file. Helpers now live in streams.ts, the temporary
  livestream.test.ts was removed, and ownership was handed back. Future reuse:
  send a one-line instruction to read the brief, or use bracketed paste (`-p`).

### Automated verification

- Final iOS and Android runs each passed **16 suites / 194 tests**, including
  Atmosphere and retained route, route-helper, drawer, and shared compact-card
  regressions. Logs: `/tmp/atmosphere-task9-ios-final.log` and
  `/tmp/atmosphere-task9-android-final.log`.
- `pnpm typecheck` passed iOS, Android, and web; `pnpm lint`, explicitly scoped
  `pnpm prettier`, and `git diff --check` passed. Logs use
  `/tmp/atmosphere-task9-{types,lint,prettier}-final.log`.
- Coverage includes fresh/stale no-end policy, empty/invalid/reversed end dates,
  zero and valid raw durations, indexed-time independence, thirteen-item groups,
  missing first records/metadata, malformed fields, safe/missing URLs, real and
  missing/blank appview thumbnails, no raw-blob fallback, emoji/RTL, and runtime
  locale switching. An initial locale test used a matcher callback unsupported
  by React Native Testing Library; corrected the test to assert the label value.

### Device evidence and fixture cleanup

- New live photo groups made natural stream scrolling unsuitable before task
  0010. Used a temporary, explicitly labeled fixture projection in only the
  current account's **non-persisted Atmosphere query cache**. The query key has
  no persistedVersion (`query.ts`, `state/queries/util.ts`). No source override,
  backend record mutation, account mutation, or persisted fixture was added.
- Retrieved one additional page through the existing query function with its
  opaque cursor, then projected the actual iame.li ended group. Added labeled
  synthetic no-end/missing-thumbnail and invalid-ended-date cases, plus a
  labeled active case using the real item's unchanged appview thumbnail/URL.
  LIVE NOW on those synthetic cases is not evidence that iame.li is streaming.
- Actual light-theme screenshot review showed the real birthday/HITMAN title
  plus one remaining stream and `@iame.li streamed (first stream: 113 min)`.
  Missing-thumbnail active and invalid-date ended fixtures had no blank image
  frames or invalid duration text. The image fixture showed its real appview
  thumbnail at the intended compact size. Capture:
  `/tmp/simserver-Ua8qOo/media/390025000-1789143706402.png`.
- `.argent/flows/atmosphere-stream-link-task9.yaml` was recorded, polished to
  stable selectors, and replayed: **8 passed, 0 failed/errored/skipped**. The
  title entered the existing browser-choice path; Cancel returned to the card.
  The website was not opened and browser preference was unchanged. One final
  idle gate warned about small motion; subsequent screenshot review showed the
  settled fixture cards with no visible loading spinner, but did not identify
  the source of that earlier motion. Capture:
  `/tmp/simserver-Ua8qOo/media/386892000-1789143894400.png`.
- Restored the original query state/data and verified **original data reference
  equality**, then removed the `__atmosphereTask9QA` backup. The original single
  cached page and first subscription collection returned. No fixture remains
  installed. The saved fragment requires fixture setup; it is not a standalone
  deterministic CI QA suite. No recording is left open.
- `/tmp/atmosphere-enter-task9.yaml` is a navigation-only prefix of the already
  recorded Home/drawer path, without the obsolete first-document-menu assumption;
  its six steps passed. It does not prove first-row content or a top position.
- Android/web manual UI, other themes, and large text remain unclaimed for task
  0011. Keep the backend TODO: stale records without endedAt can display LIVE
  NOW indefinitely under the explicitly accepted prototype policy.

Task 0009 is complete. Continue with task 0010, then revisit the task-0008 mixed
replay after replacing the old unbounded photo stack. No checkpoint commit has
been made.

## Task 0010 implementation and verification

### Implemented and checked

- Added `photos.ts` / `photos.test.ts` and `components/PhotoActivity.tsx`.
  Renderer registration is wired; removed old `GrainPhotoBody` and its vertical
  image stack. Publication-root behavior is retained. No shared image component
  has been edited.
- Reused Luna `%254` for only the adapter and adapter tests; ownership is handed
  back. Parent tightened local CID parsing/exception handling, used isValidDid,
  reused getBlobUrl's existing MIME handling rather than duplicating its list,
  and made invalid/overflowing ratios fall back to square without hiding a valid
  photo. Missing/malformed alt safely becomes empty, never fabricated caption.
- Photos stay in API order, filtering only unusable media/owners/records. CID
  validation is feature-local; shared externalViews behavior is unchanged.
  Missing media renders a quiet unavailable footnote, not an empty image card.
- Multiple usable photos use the unchanged Gallery in a feature-local
  GalleryBleed boundary sized to the card. A singleton (including a group with
  only one usable image) uses AutoSizedImage plus existing ImageContextMenu and
  lightbox integration. Raw group counts remain intact while Gallery/lightbox
  indexes use the compact usable-image array.
- Lightbox gets actual URLs, alt, dimensions, refs and thumbnail dimensions;
  metricsContext/post IDs are omitted. Gallery's screen-reader fallback supplies
  just the selected ref/dimensions: the adapter aligns those to the selected
  image instead of attaching them to image zero. No bulk prefetch was added.
- Parent renderer tests cover single-image/context-preview callbacks, one
  Gallery capped at ten images from an 87-photo group, unchanged Gallery defaults, skipped-image indexes,
  screen-reader refs, surviving singletons, missing-media fallbacks, alt metadata,
  and no post metrics. List tests mock only media boundaries, preserving real
  collection dispatch. Old fake photo CIDs were replaced with valid test CIDs.
- Final checks: **17 suites / 222 tests passed on both iOS and Android**, including
  retained routes/helpers/drawer/shared Standard Site card regressions.
  All-platform typechecks, lint, scoped formatting, and diff checks passed.
  Logs: `/tmp/atmosphere-task10-cap-{ios,android,types,lint,format}.log`.
  Cap tests cover 9/10/11/87 photos, validation before limiting, original map/group
  references, ordered first ten, and opening the tenth lightbox image without metrics.
  The first list test failed because a too-broad renderer mock hid its row;
  corrected by retaining the renderer and mocking Gallery/AutoSizedImage/etc.

### Initial live device evidence before the ten-photo cap

- iPhone 17 Pro, UDID `A8ADF8F1-F81E-4D34-BD1E-4F5110FACAD5`, bundle
  `xyz.blueskyweb.app`, connected Metro 8081. Code changes reloaded the app to
  Home; the navigation-only task-9 fragment passed 6 steps to reenter Atmosphere.
- The actual j4ck.xyz **87-photo** group now occupies a 200pt-high horizontal
  Gallery rather than many screens of vertical images. Native discovery found
  `atmospherePhotoGallery` at x=34.33, width=333.33, height=200, with clipping
  enabled inside the card. Image badges and real ALT data use the existing UI.
  Initial capture: `/tmp/simserver-Ua8qOo/media/897887000-1789145081903.png`.
- A horizontal swipe moved from the parrot toward the capybara without scrolling
  the feed vertically or opening the drawer. Reviewed capture:
  `/tmp/simserver-Ua8qOo/media/795645000-1789145232801.png`.
- Tapping the capybara opened the correct full image. Read-only runtime inspection
  confirmed lightbox **index 1**, **87 images**, the capybara's original alt, and
  **no metricsContext**. Capture:
  `/tmp/simserver-Ua8qOo/media/212560000-1789145347219.png`.

### Resolved overflow: feature-local cap, shared lightbox unchanged

- The recorded `Close image` visibility gate failed. This is a real layout bug,
  not merely an AX/native selector disagreement: native discovery found the
  Close control at **x=633, y=70, width=32, height=32** on the **402pt-wide**
  screen. `Lightbox/chrome/Header.tsx` lays out ImageMenu, PagerDots, and Close in
  one row; `PagerDots.tsx` renders every dot without bounding its width. The
  87-dot strip pushes Close offscreen. The screenshot shows the overflowing dots.
- The operator rejected changing shared lightbox code and instead explicitly
  capped photo galleries at **ten images**. `getGrainPhotos()` now returns the
  first ten usable images; the same array feeds Gallery and lightbox. All 87
  raw children, shared sidecars, and the truthful outer activity count remain.
  No shared Gallery, lightbox, pager-dot, image-menu, or ImageEmbed file changed.
- Preserved the original failed recording at
  `/tmp/atmosphere-photo-gallery-task10-uncapped-failure.yaml`, then re-recorded
  the capped path. Raw new take:
  `/tmp/atmosphere-photo-gallery-task10-capped-recorded.yaml`.
- Reviewed the capped Gallery's `2/10` badge and unchanged 87-photo header:
  `/tmp/simserver-Ua8qOo/media/415492000-1789146470422.png`.
  Capped capybara lightbox with ten dots and visible Close:
  `/tmp/simserver-Ua8qOo/media/69694000-1789146547083.png`.
  Native Close is now **x=358, y=70, width=32, height=32** on the 402pt screen.
- The simulator's AX tree still omits lightbox controls despite their valid
  on-screen native frames. Replaced the failed AX gate with the same positive
  `Close image` visibility assertion on the runner's native tree, executed live
  through the recorded `atmosphere-lightbox-visible-task10.yaml` helper. The
  corresponding closed helper proves Close disappears and Atmosphere returns.
  This is not a gesture-only dismissal or weakened check.
- Gallery horizontal movement preserved vertical position and did not open the
  drawer. The initial short, momentum-free lightbox swipe returned to the same
  image; the corrected natural left flick paged from capybara to monkeys:
  `/tmp/simserver-Ua8qOo/media/979909000-1789146751988.png`.
  The shared native pager is an unlabeled full-screen RNCPagerViewComponentView;
  its semantic `swipe: left` is the documented selector-less gesture exception.
- Used the actual Close control, returned to the feed, scrolled vertically, and
  opened/closed trezy.codes' standalone equipment photo. Lightbox capture:
  `/tmp/simserver-Ua8qOo/media/245138000-1789146890254.png`.
  Returned single-photo card:
  `/tmp/simserver-Ua8qOo/media/87844000-1789147039100.png`.
- Final `.argent/flows/atmosphere-photo-gallery-task10.yaml` replay:
  **25 passed, 0 failed/errored/skipped**, with one small-motion idle warning in
  the standalone lightbox. Subsequent Close/hidden/Atmosphere checks passed.
  Manual singleton capture showed a loaded image; the replay's transient motion
  source was not identified. Images/counts were visually reviewed, not asserted
  by deterministic screenshot baselines. The flow remains live-data dependent.

### Retained mixed-share replay repaired and passed

- After reentering at the top through the six-step navigation-only fragment,
  the old mixed-share replay reached recommendation proof but missed its quote
  tap: the quote was below the bottom bar. Thread identity correctly failed.
  Recorded the missing vertical seek and quote visibility check, then added
  only `scroll-to` for the scoped quote ahead of the existing checks/tap.
  Raw captured span: `/tmp/atmosphere-mixed-share-scroll-task10-recorded.yaml`.
- Reentered from Home, then the complete
  `.argent/flows/atmosphere-mixed-share-task8.yaml` passed **8 steps, 0 failures**.
  Its recommendation, scoped quote, and Thread options checks are unchanged.
  Reviewed the resulting renderg.host post:
  `/tmp/simserver-Ua8qOo/media/416017000-1789147374422.png`.
  This supersedes task 0008's earlier unproven-full-replay caveat.

### Continuation

Task 0010 is complete; task 0011 is next. No checkpoint commit has been made.
The simulator currently shows the renderg.host thread reached by the mixed-share
replay. No cache fixtures, backups in runtime globals, or active recordings were
created in the cap-verification session. No account/backend mutations or saved
images. Android/web manual UI, other themes, large text, and actual screen-reader
interaction remain unclaimed for task 0011; native preset tests are not device QA.

## Task 0011 in-progress integration and reconnect handoff

- Operator resumed work and requested delegation. Task 0011 is `in_progress`.
- Luna `%259` completed `timelineDates.ts` / `timelineDates.test.ts`: 11 tests
  passed. Inclusive rolling three-hour cutoff, local-calendar keys, future dates
  unheaded, invalid dates omitted from heading generation. Ownership handed back.
- Luna `%260` completed `rowLayout.test.ts` / `timeline.test.ts`: 13 tests passed,
  no bugs reported. Ownership handed back; no delegates are writing these files.
- Parent implemented `rowLayout.ts`, `timeline.ts`, `useTimelineNow.ts`, and
  `components/TimelineRow.tsx`, wired through `index.tsx`. Layout metadata is
  outside the minimal computed view. Headings live inside their first outer row,
  not in new group/list containers. Existing item/sidecar references stay intact.
- Actual renderability determines card/footnote spacing (14/24/8), including
  unavailable-content fallbacks. Share selection and article/subscription targets
  are reused by rendering and layout classification. Removed independent vertical
  renderer padding; compact separators and date headings are owned by TimelineRow.
  Shared image and lightbox components remain untouched.
- Parent added classifier/rendered-card agreement and one-debug-control checks to
  the existing renderer test helper. Combined check passed **5 iOS suites / 114
  tests**: date, layout, timeline, screen, and renderer tests.
  Log: `/tmp/atmosphere-task11-combined-tests.log`.
- On operator request, reconnected Argent. JS debugger connected on 8081 to the
  correct worktree; native tooling reported `stale_process`. An app-only restart
  restored native `connected: true`; Metro and simulator were not restarted.
- Recorded, polished, and replayed `.argent/flows/atmosphere-timeline-task11.yaml`:
  **10/10 passed** for launch/Home/drawer/Atmosphere navigation. It composes the
  previously recorded navigation-only `.argent/flows/atmosphere-enter.yaml`.
  This proves recovery/navigation, not complete timeline acceptance.
- Actual first-viewport review shows unheaded recent rows, a compact separator,
  and Earlier today before the first older-today row:
  `/tmp/simserver-IDWOHd/media/871426000-1789154212883.png`.
  Native date-heading ID resolves; Yesterday is mounted below the viewport and
  has not yet been visually checked. Simulator currently shows Atmosphere at top.
- Remaining work: finish reviewing delegate tests (strengthen the DST example,
  which currently compares noons after the transition); add clock/resume/language
  and list lifecycle/account-switch integration coverage; formatting/type/lint and
  full native regression checks; date-heading/spacing/pagination UI verification,
  Android/web/theme/large-text/keyboard/screen-reader checks; update the stale
  frontend specification and final evidence. No task 0011 completion claim yet.
- No active recording, fixture cache, shared media edits, or new commit.
