import {useEffect} from 'react'

import {onAppStateChange} from '#/lib/appState'
import {useAnalytics} from '#/analytics'

/**
 * Tracks app foreground/background transitions without measuring duration.
 */
export function PassiveAnalytics() {
  const ax = useAnalytics()

  useEffect(() => {
    const sub = onAppStateChange(state => {
      if (state === 'active') {
        ax.metric('state:foreground', {})
      } else {
        ax.metric('state:background', {})
      }

      // if (IS_DEV || IS_TESTFLIGHT) {
      //   const feats = Object.values(Features).reduce(
      //     (acc, feat) => {
      //       acc[feat] = features.evalFeature(feat)
      //       return acc
      //     },
      //     {} as Record<Features, any>,
      //   )
      //   ax.logger.info('FEATURES', {
      //     features: feats,
      //     definitions: features.getFeatures(),
      //   })
      // }
    })
    return () => sub.remove()
  }, [ax])

  return null
}
