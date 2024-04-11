import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'

import {isIOS, isWeb} from 'platform/detection'

const hapticImpact: ImpactFeedbackStyle = isIOS
  ? ImpactFeedbackStyle.Medium
  : ImpactFeedbackStyle.Light // Users said the medium impact was too strong on Android; see APP-537s

export function playHaptic(disabled: boolean) {
  if (disabled || isWeb) {
    return
  }
  impactAsync(hapticImpact)
}
