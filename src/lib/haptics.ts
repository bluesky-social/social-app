import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  selectionAsync,
} from 'expo-haptics'

import {isIOS, isWeb} from 'platform/detection'

const hapticImpact: ImpactFeedbackStyle = isIOS
  ? ImpactFeedbackStyle.Medium
  : ImpactFeedbackStyle.Light // Users said the medium impact was too strong on Android; see APP-537s

export class Haptics {
  static default(enabled: boolean) {
    if (!enabled || isWeb) {
      return
    }

    impactAsync(hapticImpact)
  }
  static impact(type: ImpactFeedbackStyle = hapticImpact, enabled: boolean) {
    if (!enabled || isWeb) {
      return
    }
    impactAsync(type)
  }
  static selection(enabled: boolean) {
    if (!enabled || isWeb) {
      return
    }
    selectionAsync()
  }
  static notification = (
    type: 'success' | 'warning' | 'error',
    enabled: boolean,
  ) => {
    if (!enabled || isWeb) {
      return
    }
    switch (type) {
      case 'success':
        return notificationAsync(NotificationFeedbackType.Success)
      case 'warning':
        return notificationAsync(NotificationFeedbackType.Warning)
      case 'error':
        return notificationAsync(NotificationFeedbackType.Error)
    }
  }
}
