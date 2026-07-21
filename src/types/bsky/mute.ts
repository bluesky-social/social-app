import {type AppBskyActorDefs} from '@atproto/api'

/*
 * TODO: remove this module once @atproto/api ships scoped mutes
 * (https://github.com/bluesky-social/atproto/pull/5118) and use the SDK types
 * directly.
 */

/**
 * The kinds of content a mute can be scoped to. Omitting kinds when muting
 * creates a full mute.
 */
export type MuteKind = 'reposts' | 'quoteposts'

/**
 * `ViewerState` extended with the scoped-mute fields. Scoped mutes are
 * exclusive with `muted`: `mutedReposts`/`mutedQuoteposts` can be true while
 * `muted` is false.
 */
export type ViewerStateWithScopedMutes = AppBskyActorDefs.ViewerState & {
  mutedReposts?: boolean
  mutedQuoteposts?: boolean
}

/**
 * Reads the full mute state from a profile's viewer state, including scoped
 * mutes. Single accessor so the casts around the not-yet-released API fields
 * live in one place.
 */
export function getMuteState(viewer?: AppBskyActorDefs.ViewerState) {
  const viewerState: ViewerStateWithScopedMutes | undefined = viewer
  const muted = !!viewerState?.muted
  const mutedReposts = !!viewerState?.mutedReposts
  const mutedQuoteposts = !!viewerState?.mutedQuoteposts
  return {
    muted,
    mutedReposts,
    mutedQuoteposts,
    /**
     * Whether the account is muted in any fashion, fully or scoped.
     */
    isMutedAny: muted || mutedReposts || mutedQuoteposts,
  }
}
