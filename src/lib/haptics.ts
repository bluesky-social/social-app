import React from 'react'
import * as Device from 'expo-device'
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'

import {useHapticsDisabled} from '#/state/preferences/disable-haptics'
import {IS_IOS, IS_WEB} from '#/env'

export function useHaptics() {
  const isHapticsDisabled = useHapticsDisabled()

  return React.useCallback(
    (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      if (isHapticsDisabled || IS_WEB) {
        return
      }

      // Users said the medium impact was too strong on Android; see APP-537s
      const style = IS_IOS
        ? ImpactFeedbackStyle[strength]
        : ImpactFeedbackStyle.Light
      impactAsync(style)

      // DEV ONLY - show a toast when a haptic is meant to fire on simulator
      if (__DEV__ && !Device.isDevice) {
        // disabled because it's annoying
        // Toast.show(`Buzzz!`)
      }
    },
    [isHapticsDisabled],
  )
}
