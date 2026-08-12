import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {account, useStorage} from '#/storage'

/*
 * Positions older than this are discarded rather than restored. Paginating
 * that far back is slow, and the user has likely moved on.
 */
const MAX_POSITION_AGE = 24 * 60 * 60 * 1000

/**
 * Whether the Following feed should restore the last read position on cold
 * start. The GrowthBook gate is a hard requirement, so turning the flag off
 * disables the feature (and hides its settings toggle) for everyone. Within
 * the gate, the feature is on by default and the user can opt out from the
 * Following feed preferences screen.
 */
export function useFollowingFeedResumeEnabled() {
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const [enabled, setEnabled] = useStorage(account, [
    currentAccount?.did ?? '',
    'followingFeedResumeEnabled',
  ])
  const gateEnabled = ax.features.enabled(ax.features.FollowingFeedResumeEnable)
  const setEnabledAndTrack = (value: boolean) => {
    ax.metric('feed:resume:toggle', {enabled: value})
    setEnabled(value)
  }
  return [gateEnabled && (enabled ?? true), setEnabledAndTrack] as const
}

/**
 * Save the most recently viewed post in the Following feed as the anchor to
 * restore to on next cold start.
 */
export function saveFollowingFeedPosition(did: string, anchorUri: string) {
  account.set([did, 'followingFeedPosition'], {
    anchorUri,
    savedAt: Date.now(),
  })
}

/**
 * Returns the saved anchor post URI, or undefined if nothing was saved or the
 * saved position has expired.
 */
export function getFollowingFeedPosition(did: string): string | undefined {
  const position = account.get([did, 'followingFeedPosition'])
  if (!position || Date.now() - position.savedAt > MAX_POSITION_AGE) {
    return undefined
  }
  return position.anchorUri
}

export function clearFollowingFeedPosition(did: string) {
  account.remove([did, 'followingFeedPosition'])
}
