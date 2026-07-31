import {device, useStorage} from '#/storage'

/**
 * Persisted dismiss state for the "Import contacts or invite your friends"
 * promo banner shown on the Followers screen empty state.
 */
export function useFollowersPromoDismissed() {
  const [dismissed = false, setDismissed] = useStorage(device, [
    'inviteFriendsFollowersPromoDismissed',
  ])
  return [dismissed, setDismissed] as const
}
