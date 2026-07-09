# Analytics: What We Have, What We Need, and Options

## What's in the codebase today

The app has two analytics systems that serve different purposes:

### Metrics Client (product analytics)

`src/analytics/metrics/client.ts` is a custom event tracker. It batches events
in memory (up to 100, flushed every 10 seconds or on app background) and POSTs
them as JSON to a `/t` endpoint. The payload is simple:

```json
{
  "events": [
    {
      "source": "app",
      "time": 1719600000000,
      "event": "post:like",
      "payload": { "uri": "...", "authorDid": "...", ... },
      "metadata": { "navigation": { "currentScreen": "..." }, ... }
    }
  ]
}
```

There are ~180 distinct event types defined in
`src/analytics/metrics/types.ts`, covering the full user journey:

- **App lifecycle:** init timing, background/foreground, navigation
- **Auth:** login, logout, OAuth session health, signup funnel steps
- **Content:** post create/like/repost/bookmark/share, feed scroll/refresh
- **Social:** follow/unfollow, profile views, suggested users
- **Chat:** DM and group chat creation, messaging, moderation
- **Search:** queries, result clicks, autocomplete
- **Composer:** open, GIF/image selection, threadgate, drafts
- **Onboarding:** each step's completion/skip, starter packs
- **Moderation:** labeler subscriptions, report dialog
- **Features:** verification, live events, trending topics, contacts
- **Translation:** source/target language, override behavior

The endpoint is currently `https://events.bsky.app/t` -- Bluesky's
infrastructure, which Blacksky cannot and should not use.

### GrowthBook (feature flags + A/B testing)

`src/analytics/features/index.ts` is a GrowthBook SDK integration. It fetches
feature flag values from a GrowthBook server and evaluates them locally. It
also tracks experiment assignments by calling back into the metrics client
(`experiment:viewed` and `feature:viewed` events).

GrowthBook attributes sent for targeting include: deviceId, sessionId,
platform, appVersion, countryCode, DID, isBlackskyPds, appLanguage, and
currentScreen.

The endpoint is currently `https://events.bsky.app/gb` with Bluesky's SDK key.

## Why GrowthBook doesn't cover product analytics

GrowthBook is a feature flag evaluation engine, not an analytics platform.
Here's what it does and doesn't do:

**GrowthBook does:**
- Serve feature flag values (on/off, multivariate)
- Assign users to experiment variants
- Track which flag/experiment a user was exposed to

**GrowthBook does not:**
- Store or query event data
- Provide dashboards, funnels, retention charts, or user segments
- Count how many times `post:like` fired today
- Tell you your DAU or signup conversion rate
- Answer "what do users do after they follow someone?"

GrowthBook *consumes* analytics data for experiment analysis -- it connects to
an external data warehouse (BigQuery, ClickHouse, etc.) where your events
land, and runs statistical analysis against it. But it doesn't collect or store
those events itself.

So even if Blacksky sets up its own GrowthBook instance, it still needs
somewhere for the ~180 metric events to go. Without that, GrowthBook has
nothing to analyze experiments against, and you have no product analytics at
all.

## What Blacksky actually needs to decide

Two independent questions:

1. **Do we need product analytics?** (Where do the ~180 events go?)
2. **Do we need feature flags?** (Do we need GrowthBook or equivalent?)

These can be answered separately. You can have analytics without feature flags,
or feature flags without analytics (though experiment analysis requires both).

## Options for product analytics

### Option A: Disable metrics entirely

**Change:** Guard `MetricsClient.start()` on `METRICS_API_HOST` being set.
Clear the default so it doesn't point at Bluesky. Events still fire in code
but go nowhere.

```ts
// src/analytics/metrics/client.ts
start() {
  if (!env.METRICS_API_HOST) return  // no-op without configured endpoint
  // ...existing code
}
```

**Pros:**
- Zero operational burden
- No data collection to worry about (privacy-first)
- App works identically; all 180 event callsites are already no-ops when the
  client doesn't start

**Cons:**
- No visibility into how the app is used
- Can't measure impact of changes
- Flying blind on funnel conversion, feature adoption, etc.

**Best for:** Getting to App Store submission fast without another service to
set up. Can always enable later since the instrumentation stays in the code.

### Option B: PostHog (self-hostable, open source)

**What it is:** Open-source product analytics platform. Covers event tracking,
funnels, retention, session replay, feature flags (could replace GrowthBook
too). Self-hostable or cloud-hosted.

**Integration approach:** Write a thin adapter in `MetricsClient.sendBatch`
that transforms the existing event format into PostHog's `capture` API format,
or replace `MetricsClient` with PostHog's React Native SDK (`posthog-react-native`).

The adapter approach is lower-effort since all 180 event callsites stay
unchanged:

```ts
// Adapter approach: transform payload in sendBatch
private async sendBatch(events: Event<M>[]) {
  for (const event of events) {
    posthog.capture(event.event, { ...event.payload, ...event.metadata })
  }
}
```

**Pros:**
- Full analytics suite (funnels, retention, paths, session replay)
- Self-hostable -- own your data
- Has feature flags built in (could replace GrowthBook)
- React Native SDK available
- Free self-hosted tier; cloud free tier is generous

**Cons:**
- Self-hosting requires infrastructure (ClickHouse + Kafka + Postgres)
- Cloud-hosted sends data to PostHog's servers (same tradeoff as any SaaS)
- Adding a new SDK dependency

**Best for:** Blacksky wants real product analytics and is willing to either
self-host or use PostHog Cloud.

### Option C: Custom ingest to your own data store

**What it is:** Stand up a lightweight endpoint (Cloudflare Worker, serverless
function, small service) that accepts the existing `POST /t` JSON format and
writes events to a data store.

**Integration approach:** No client-side changes needed. Just set
`METRICS_API_HOST` to your endpoint. The existing `MetricsClient` works as-is.

```
App  -->  POST /t {"events": [...]}  -->  Your Worker  -->  ClickHouse / BigQuery / Postgres
```

**Pros:**
- Zero client-side changes (just set the env var)
- Full control over data storage and retention
- Can be very cheap (a Cloudflare Worker + a ClickHouse Cloud free tier)
- Own your data completely
- Can add dashboarding later (Grafana, Metabase, etc.)

**Cons:**
- Need to build and maintain the ingest endpoint
- Need to build or configure dashboarding separately
- No built-in funnels/retention/paths -- need to query manually or add a tool

**Best for:** Blacksky wants data ownership and is comfortable with some
backend work. The simplest version is a ~50-line worker that writes to a
database.

### Option D: Plausible or Umami (lightweight, privacy-focused)

**What it is:** Privacy-focused web analytics tools. Both are open source and
self-hostable. Designed for page views and simple events, not the ~180 typed
events this app tracks.

**Pros:**
- Privacy-first by design (no cookies, GDPR-compliant)
- Very simple to self-host
- Good for basic "how many users do we have" questions

**Cons:**
- Not designed for rich mobile app event tracking
- Limited event payload support (Plausible: 1 custom property per event)
- No funnels, retention, or user-level analysis
- Would lose most of the event detail the codebase already tracks
- Designed for websites, not React Native apps

**Best for:** If Blacksky only cares about basic traffic metrics and doesn't
need the detailed event tracking already instrumented in the codebase.

### Option E: Mixpanel or Amplitude (SaaS)

**What it is:** Commercial product analytics platforms. Industry standard for
mobile apps.

**Integration approach:** Replace `MetricsClient` with their React Native SDK,
or write an adapter (same pattern as PostHog).

**Pros:**
- Polished dashboards, funnels, retention out of the box
- No infrastructure to manage
- React Native SDKs available
- Free tiers available (Mixpanel: 20M events/month; Amplitude: 50M)

**Cons:**
- Data lives on their servers (not self-hostable)
- Vendor lock-in
- Free tier limits may be hit depending on user base
- Adding a new SDK dependency

**Best for:** If Blacksky wants analytics quickly without managing
infrastructure and is comfortable with SaaS.

## GrowthBook is actively used in production

GrowthBook is not hypothetical -- it currently gates features in the app.
There are 11 flags defined in `src/analytics/features/types.ts` and checked
across 20+ callsites:

**Kill switches (disable flags) -- `false` = feature ON:**
- `GroupChatsDisable` -- gates group chat creation and UI (3 screens)
- `ImportContactsOnboardingDisable` -- gates contacts import in onboarding
- `ImportContactsSettingsDisable` -- gates contacts import in settings
- `LiveNowBetaDisable` -- gates live streaming feature

**Feature gates (enable flags) -- `false` = feature OFF:**
- `DmsNewMessageComposerEnable` -- new DM composer in message threads
- `ComposerLanguageDetectionEnable` -- auto language detection in composer
- `PostGalleryEmbedEnable` -- gallery layout for image embeds in feeds
- `NotificationsExpandedProfileCardEnable` -- expanded profile cards in
  notification items

**Internal/debug:**
- `IsBskyTeam` -- internal team detection
- `DebugFeedContext` -- debug tool for feed context in post menu
- `AATest` -- A/A test for validating experiment infrastructure

**Without GrowthBook, all flags default to `false`.** This means the kill
switches are fine (features stay enabled), but the enable-gated features
disappear: no gallery embeds, no new DM composer, no language detection, no
expanded notification cards. This is not acceptable for production.

## Options for feature flags

### Option 1: Keep GrowthBook (recommended)

Set up a Blacksky GrowthBook instance (self-hosted or cloud). Update
`GROWTHBOOK_API_HOST` and `GROWTHBOOK_CLIENT_KEY` env vars. The existing SDK
integration works as-is with zero code changes.

GrowthBook Cloud has a free tier (up to 3 team members). Self-hosting is a
single Docker container (Node.js app + MongoDB).

To replicate the current behavior, create the 11 flags in the GrowthBook
dashboard and set the enable-flags to `true` for all users. The kill switches
can stay `false` (features enabled by default) and be flipped if an emergency
rollback is needed.

If you want experiment analysis, GrowthBook needs a data source connection
(ClickHouse, BigQuery, Postgres, etc.) where your product analytics events
land. Without this, flags still work -- you just can't run experiments.

### Option 2: Hardcode the enable-flags to `true`

If GrowthBook is not set up in time for launch, change the defaults for the
enable-flags so features work without a flag server:

```ts
// src/analytics/features/index.ts
// In the GrowthBook constructor, add forcedFeatures:
export const features = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
  // Defaults when GrowthBook server is unreachable
  forcedFeatures: new Map([
    ['dms:new_message_composer:enable', true],
    ['composer:language_detection:enable', true],
    ['post_gallery_embed:enable', true],
    ['notifications:expanded_profile_card:enable', true],
  ]),
})
```

This ensures features work even without a GrowthBook server, while preserving
the ability to override them remotely once GrowthBook is configured.

**Tradeoff:** You lose the ability to remotely disable features (kill switch)
until GrowthBook is set up. If a feature is buggy after launch, you'd need a
code change + OTA update instead of flipping a flag.

### Option 3: Replace with PostHog feature flags

If choosing PostHog for analytics, its built-in feature flags could replace
GrowthBook. This would require replacing the GrowthBook SDK calls with
PostHog's API, which touches ~20 callsites.

Not recommended unless also switching to PostHog for analytics.

## Recommendation

1. **Product analytics:** Disable for App Store launch (Option A). Guard
   `MetricsClient.start()` on `METRICS_API_HOST` being set. Zero effort, zero
   risk. The ~180 event callsites stay in the code for when you're ready.

2. **Feature flags:** Use Option 2 (hardcode defaults) for launch, then set up
   GrowthBook (Option 1) post-launch. This gets features working immediately
   with a path to remote flag control.

3. **Post-launch:** Stand up GrowthBook + decide on a product analytics
   backend. If you go with PostHog or a custom ingest, connect it as
   GrowthBook's data source for experiment analysis.
