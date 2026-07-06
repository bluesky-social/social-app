import {useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {getComposerImageLayout} from '#/storage/hooks/composer-image-layout'
import {type ImageLayout} from '../state/composer'

/**
 * Returns a getter for the image layout to apply to freshly created or
 * re-picked 2-4 image sets. When the layout toggle experiment is off, users
 * keep today's behavior (the legacy `images` embed), so we force `grid`. When
 * it's on, we honor the account-level preference, which defaults to `carousel`.
 *
 * The returned function reads the stored preference imperatively when CALLED,
 * so callers get the current value at event time (dispatch, reducer init,
 * remove handler) rather than a render-captured value that can lag the store.
 */
export function useGetPreferredImageLayout(): () => ImageLayout {
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const gateEnabled = ax.features.enabled(
    ax.features.ComposerImageLayoutToggleEnable,
  )
  return () => {
    if (!gateEnabled) return 'grid'
    return getComposerImageLayout(currentAccount?.did)
  }
}
