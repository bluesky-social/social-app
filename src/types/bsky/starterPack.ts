import {type AppBskyGraphDefs} from '@atproto/api'

import {app} from '#/lexicons'

/*
 * The generated `$type`-only guards. The old `@atproto/api`
 * `AppBskyGraphDefs.isStarterPackView*` helpers matched on a present,
 * matching `$type`; we reproduce that here against the `#/lexicons` schema's
 * `$type` string rather than delegating to the schema's `isTypeOf` (which
 * treats a missing `$type` as a match).
 */
export function isBasicView(
  v: unknown,
): v is app.bsky.graph.defs.StarterPackViewBasic {
  return (
    v != null &&
    typeof v === 'object' &&
    (v as {$type?: unknown}).$type ===
      app.bsky.graph.defs.starterPackViewBasic.$type
  )
}

export function isView(v: unknown): v is app.bsky.graph.defs.StarterPackView {
  return (
    v != null &&
    typeof v === 'object' &&
    (v as {$type?: unknown}).$type === app.bsky.graph.defs.starterPackView.$type
  )
}

/**
 * Matches any starter pack view exported by our SDK.
 *
 * TODO(phase4): drop the `@atproto/api` arms. Dual-world widening alias for the
 * migration interim - starter-pack producers still return old views via the
 * bridge agent. Remove the old arms once every producer emits `#/lexicons`
 * views.
 */
export type AnyStarterPackView =
  | app.bsky.graph.defs.StarterPackViewBasic
  | app.bsky.graph.defs.StarterPackView
  | AppBskyGraphDefs.StarterPackViewBasic
  | AppBskyGraphDefs.StarterPackView
