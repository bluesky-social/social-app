import {type AppBskyGraphDefs} from '@atproto/api'

import {app} from '#/lexicons'

/*
 * `$type`-only guards for starter pack views. They compare against the
 * `#/lexicons` schema's `$type` string rather than delegating to the schema's
 * `isTypeOf` (which treats a missing `$type` as a match), matching the
 * present-and-equal semantics of the old `@atproto/api`
 * `AppBskyGraphDefs.isStarterPackView*` helpers.
 *
 * The `$type` string is identical in both worlds, so a single check narrows a
 * value from either producer; the narrowed type is the union of both worlds'
 * views for the same reason {@link AnyStarterPackView} is.
 */
export function isBasicView(
  v: unknown,
): v is
  | app.bsky.graph.defs.StarterPackViewBasic
  | AppBskyGraphDefs.StarterPackViewBasic {
  return (
    v != null &&
    typeof v === 'object' &&
    (v as {$type?: unknown}).$type ===
      app.bsky.graph.defs.starterPackViewBasic.$type
  )
}

export function isView(
  v: unknown,
): v is app.bsky.graph.defs.StarterPackView | AppBskyGraphDefs.StarterPackView {
  return (
    v != null &&
    typeof v === 'object' &&
    (v as {$type?: unknown}).$type === app.bsky.graph.defs.starterPackView.$type
  )
}

/**
 * Matches any starter pack view exported by our SDK, in either world.
 *
 * Both the generated `#/lexicons` views and the `@atproto/api` views are
 * accepted because both are live producers: queries migrated to the lexicon
 * client emit the former, unmigrated ones emit the latter.
 *
 * TODO: remove the @atproto/api arms once all producers emit #/lexicons views
 */
export type AnyStarterPackView =
  | app.bsky.graph.defs.StarterPackViewBasic
  | app.bsky.graph.defs.StarterPackView
  | AppBskyGraphDefs.StarterPackViewBasic
  | AppBskyGraphDefs.StarterPackView
