import {type AppBskyActorDefs} from '@atproto/api'

/*
 * TODO: remove this module once @atproto/api ships scoped mutes
 * (https://github.com/bluesky-social/atproto/pull/5118) and use the SDK types
 * directly.
 */

/**
 * `ViewerState` extended with the scoped-mute field. Scoped mutes are
 * exclusive with `muted`: `mutedOnlyReposts` can be true while `muted` is
 * false, and is false whenever `muted` is true.
 */
export type ViewerStateWithScopedMutes = AppBskyActorDefs.ViewerState & {
  mutedOnlyReposts?: boolean
}

/**
 * Whether the account's reposts (and only their reposts) are muted. Single
 * accessor so the casts around the not-yet-released API field live in one
 * place.
 */
export function getMutedOnlyReposts(
  viewer?: AppBskyActorDefs.ViewerState,
): boolean {
  const viewerState: ViewerStateWithScopedMutes | undefined = viewer
  return !!viewerState?.mutedOnlyReposts
}
