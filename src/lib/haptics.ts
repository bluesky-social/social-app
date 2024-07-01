import React from 'react'
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'

import {isIOS, isWeb} from 'platform/detection'
import {useHapticsDisabled} from 'state/preferences/disable-haptics'

export function useHaptics() {
  const isHapticsDisabled = useHapticsDisabled()

  return React.useCallback(
    (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      if (isHapticsDisabled || isWeb) {
        return
      }

      // Users said the medium impact was too strong on Android; see APP-537s
      const style = isIOS
        ? ImpactFeedbackStyle[strength]
        : ImpactFeedbackStyle.Light
      impactAsync(style)
    },
    [isHapticsDisabled],
  )
}
