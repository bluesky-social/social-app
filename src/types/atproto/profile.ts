import {AppBskyActorDefs, ChatBskyActorDefs} from '@atproto/api'

export {
  /**
   * Renamed to clarify source of this util, but directly aliases the original.
   * {@link AppBskyActorDefs.isProfileViewBasic}
   */
  isProfileViewBasic as isBasicView,
  /**
   * Renamed to clarify source of this util, but directly aliases the original.
   * {@link AppBskyActorDefs.isProfileViewDetailed}
   */
  isProfileViewDetailed as isDetailedView,
  /**
   * Renamed to clarify source of this util, but directly aliases the original.
   * {@link AppBskyActorDefs.isProfileView}
   */
  isProfileView as isView,
} from '@atproto/api/dist/client/types/app/bsky/actor/defs'

/**
 * Matches any profile view exported by our SDK
 */
export type AnyProfileView =
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewDetailed
  | ChatBskyActorDefs.ProfileViewBasic
