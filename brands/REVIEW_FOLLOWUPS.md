# Brand-config system - review follow-ups

Findings from the pre-merge review of the `4-brand-config-system` branch
(PR #5) that were intentionally deferred. Two findings from that review were
fixed before merge and are NOT listed here:

- The unconditional community-membership write on account creation was removed
  entirely (`src/lib/community.ts` deleted, `writeMembershipRecord` calls
  dropped from `src/state/session/agent.ts`).
- The production (bskyweb) splash was made brand-aware for background color and
  `mask-icon` color, and the hardcoded Bluesky butterfly is now gated to the
  `bluesky` brand only (see the partial follow-up under "Production splash"
  below for what remains).

Ordered roughly by impact.

## 1. Default `<Logo>` fill changed from brand color to theme text color

`src/view/icons/Logo.tsx` - the default `_fill` went from
`t.palette.primary_500` to `t.atoms.text.color`. Every `<Logo>` call site that
does not pass an explicit `fill` (bottom tab bar, nav signup card, etc.) now
renders in the theme text color (black/white) instead of the brand primary. For
the `bluesky` brand this is a visible regression vs upstream (the butterfly was
always blue). Decide whether the new behavior is intended for the monochrome
brands; if so, drive it from a per-brand logo `tint` so `bluesky` keeps
`primary_500`.

## 2. Production splash: brand mark not server-rendered

`bskyweb/templates/base.html` - background + `mask-icon` color are now
brand-aware, and only `bluesky` inlines its mark. Other brands show a
correctly-colored blank splash until the JS bundle hydrates and `boot.ts`
paints the brand mark. To get a pixel-perfect first paint for the other brands
we need small, optimized per-brand splash SVGs (the `k4m2a`/`coseeker` earth
mark is ~2.17 MB and cannot be inlined into every SSR response) wired through
the Go `Brand` struct. The favicon `<link>` PNGs are also still Bluesky's;
`boot.ts` swaps them client-side post-hydration, but a brand-correct
pre-hydration favicon needs per-brand favicon assets in `static/`.

## 3. Large brand SVGs eagerly imported into every bundle

`src/brand/registry.ts` statically imports all four brands.
`brands/shared/earthMark.svg.ts` is ~2.17 MB and `mdparivaar/logoIcon.svg.ts`
is ~118 KB, so every deployment - including the native single-tenant build
where the brand is fixed at compile time - ships ~2.3 MB of SVG it never
renders. `SvgXml` also re-parses these strings on every render of the tab
bar/splash. Code-split per active brand (dynamic import keyed on
`EXPO_PUBLIC_BRAND` / hostname), move large marks to lazily-loaded assets, and
run the SVGs through SVGO.

## 4. `defaultFeeds` discover/timeline contract is positional and unchecked

`src/lib/constants.ts` - `DISCOVER_SAVED_FEED` / `TIMELINE_SAVED_FEED` read
`brand.defaultFeeds[0]` / `[1]`. The discover-then-timeline ordering is enforced
only by a length check in `src/brand/boot.ts`. A brand author who lists feeds in
another order silently mislabels feeds. Make it a named shape, e.g.
`defaultFeeds: {discover, timeline, extra?[]}`, so the contract is structural.

## 5. Web hostname resolution silently falls back to `bluesky`

`src/brand/resolve.web.ts` - `HOSTNAME_TO_BRAND_ID` matches
`window.location.hostname` verbatim. Any unlisted host (staging, preview URL,
Lightsail default domain, `localhost` without `EXPO_PUBLIC_BRAND`) renders as
Bluesky with the wrong PDS/feeds and no error surfaced. Consider a louder
fallback in dev, and/or derive the map from each brand's `webHost`.

## 6. Hostname->brand map + brand identity duplicated across TS and Go

`src/brand/resolve.web.ts` <-> `bskyweb/cmd/bskyweb/brand.go`. The hostname
mapping, per-brand metadata, and now the splash background/primary colors are
hand-mirrored in two languages (the Go comments say "mirrors ..."). They will
drift - add or rename a brand on the TS side and SSR OG tags / splash colors
keep serving the old value. Emit a single JSON manifest from the TS brand
registry at build time and have the Go layer read it, or add a test asserting
the two maps have identical keys.

## 7. Trending is gated in three places despite a single-chokepoint comment

`src/state/service-config.tsx` claims gating `useTrendingConfig().enabled`
covers every consumer, but `src/screens/Search/modules/ExploreTrendingVideos.tsx`
and `src/view/com/posts/PostFeed.tsx` re-check `brand.features.showTrending`
directly because the video surfaces do not route through `useTrendingConfig`.
Route the video interstitial / Explore module through `useTrendingConfig().enabled`
(the way `trendingTopics` is filtered) so `showTrending` funnels through one
boolean, and fix the comment.

## 8. i18n conventions on touched strings

Per `CLAUDE.md`: touched `_(msg`...`)` strings (e.g.
`src/components/dialogs/Signin.tsx`, `src/screens/Signup/StepInfo/Policies.tsx`,
`src/components/NewskieDialog.tsx`) should be refactored to the `l` macro, and
`src/lib/strings/headings.ts` joins page + brand with a bare em dash (`—`)
instead of a non-breaking space + en dash.

## 9. Duplicated brand config data

`brands/coseeker/brand.ts` - the palette ramps (~180 lines) are a verbatim copy
of `brands/k4m2a/brand.ts`, with variables still named `k4m2a*`. The `links`
and `blogUrls` blocks are also copy-pasted Bluesky values across all four
brands. Extract shared ramps/defaults (e.g. `brands/shared/`) so a brand only
declares what it overrides.
