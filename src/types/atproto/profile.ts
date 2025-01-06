import {AppBskyActorDefs} from '@atproto/api'

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

/**
 * Maps any profile view type to `ProfileViewBasic`.
 */
export function anyToBasic(
  view: AnyProfileView,
): AppBskyActorDefs.ProfileViewBasic {
  return {
    $type: 'app.bsky.actor.defs#profileViewBasic',
    did: view.did,
    handle: view.handle,
    displayName: view.displayName,
    avatar: view.avatar,
    associated: view.associated,
    viewer: view.viewer,
    labels: view.labels,
    createdAt: view.createdAt,
  }
}

/**
 * Maps `ProfileViewDetailed` to `ProfileView`.
 */
export function detailedToView(
  view: AppBskyActorDefs.ProfileViewDetailed,
): AppBskyActorDefs.ProfileView {
  return {
    $type: 'app.bsky.actor.defs#profileView',
    did: view.did,
    handle: view.handle,
    displayName: view.displayName,
    avatar: view.avatar,
    associated: view.associated,
    viewer: view.viewer,
    labels: view.labels,
    createdAt: view.createdAt,
    description: view.description,
    indexedAt: view.indexedAt,
  }
}
