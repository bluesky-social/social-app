import {app} from '#/lexicons'

/*
 * The generated `$type`-only guards. These match on a present, matching
 * `$type` against the `#/lexicons` schema's `$type` string rather than
 * delegating to the schema's `isTypeOf` (which treats a missing `$type` as a
 * match).
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
 * Accepts both forms of a full Starter Pack view used by the app:
 *
 * - direct lexicon refs returned by the app view, where `$type` may be omitted
 * - trusted synthetic cache entries, which carry `$type` but may contain
 *   placeholder fields that do not yet pass full schema validation
 */
export function isTrustedView(
  v: unknown,
): v is app.bsky.graph.defs.StarterPackView {
  return isView(v) || app.bsky.graph.defs.starterPackView.matches(v)
}

/**
 * Matches any Starter Pack view exported by our SDK.
 */
export type AnyStarterPackView =
  app.bsky.graph.defs.StarterPackViewBasic | app.bsky.graph.defs.StarterPackView
