# News Feed

A curated news experience: the user picks topics and regions, optionally opts
out of specific sources, and gets a feed of posts from an approved set of
accounts matching those facets.

## Data model

Two datasets, deliberately stored differently:

- **User selections (Dataset 1)** - per-user, synced. Stored as a published
  atproto record in the user's PDS: collection `social.redacted.newsFeedPrefs`,
  rkey `self`. See `state/prefs.ts`. (`redacted` is a placeholder authority
  segment until the real domain is chosen.)
- **Source registry (Dataset 2)** - shared, operator-curated config mapping
  accounts to topic / region / language tags. Local list in `sources.ts`. This
  is not a user preference, so it does not live in the PDS.

Topic matching is account-level (a source is tagged with the topics it covers).
Language is not a news-feed setting: the feed reuses the app's normal content
language preference (`languagePrefs.contentLanguages`), applied at feed-assembly
time.

## Flow

1. Topic / region picker -> chooses `topics` and `regions` into a draft. Nothing
   is written yet.
2. Source review -> `selectSources(selection, {applyExclusions: false})` lists
   the matching accounts so the user can toggle individual ones into
   `excludedDids`. Finishing requires an explicit consent toggle, which then
   publishes the full draft as the prefs record.
3. Feed -> `selectSources(selection)` resolves the source set; a FeedAPI pulls
   each source's author feed and round-robins across them so every source gets
   equal representation, filtered by the user's content languages.

## Layout

- `sources.ts` - registry + taxonomy + `selectSources`
- `state/prefs.ts` - prefs record schema + read/write hooks
- `NewsFeedScreen.tsx` - orchestrates step 1 (topics/regions) -> step 2
  (sources) -> feed; an unconfigured feed drops straight into step 1
- `components/` - `SetupHeader` (step indicator), `SetupTopics` (chip picker),
  `SetupSources` (opt-out list + consent), `SetupFooter` (bottom action bar),
  `NewsFeedTab` (header + feed)

The feed itself renders through the standard `PostFeed` via a `newsfeed|<dids>`
`FeedDescriptor`; the aggregation lives in `src/lib/api/feed/news.ts`
(`NewsFeedAPI`), wired into the factory in `state/queries/post-feed.ts`. The
screen is reachable at `/news` (route `NewsFeed`) from the desktop left nav and
the mobile drawer.

## Not yet done

- The source registry holds curated demo accounts with placeholder tags; the
  `social.redacted.*` lexicon authority is a placeholder pending the real domain.
- The news feed is its own screen/route, not a tab inside the home swipe-pager.
