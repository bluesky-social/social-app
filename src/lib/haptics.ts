import {useCallback, useMemo} from 'react'
import * as ExpoHaptics from 'expo-haptics'

import {isIOS, isWeb} from '#/platform/detection'
import {useHapticsDisabled} from '#/state/preferences/disable-haptics'

export function useHapticFeedback() {
  const isHapticsDisabled = useHapticsDisabled()

  return useMemo(() => {
    if (isHapticsDisabled || isWeb) {
      return {impact: () => {}, notification: () => {}}
    }

    return {
      impact: (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
        // Users said the medium impact was too strong on Android; see APP-537s
        const style = isIOS
          ? ExpoHaptics.ImpactFeedbackStyle[strength]
          : ExpoHaptics.ImpactFeedbackStyle.Light
        ExpoHaptics.impactAsync(style)
      },
      notification: (type: ExpoHaptics.NotificationFeedbackType) => {
        ExpoHaptics.notificationAsync(type)
      },
    }
  }, [isHapticsDisabled])
}

/**
 * @deprecated use `haptics.impact()` from `useHapticFeedback()` instead
 */
export function useHaptics() {
  const isHapticsDisabled = useHapticsDisabled()

  return useCallback(
    (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      if (isHapticsDisabled || isWeb) {
        return
      }

      // Users said the medium impact was too strong on Android; see APP-537s
      const style = isIOS
        ? ExpoHaptics.ImpactFeedbackStyle[strength]
        : ExpoHaptics.ImpactFeedbackStyle.Light
      ExpoHaptics.impactAsync(style)
    },
    [isHapticsDisabled],
  )
}
