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
 * Matches any starter pack view exported by our SDK.
 */
export type AnyStarterPackView =
  | app.bsky.graph.defs.StarterPackViewBasic
  | app.bsky.graph.defs.StarterPackView
