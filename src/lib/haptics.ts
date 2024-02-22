import {isIOS, isWeb} from 'platform/detection'
import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  selectionAsync,
} from 'expo-haptics'

const impactStyle: ImpactFeedbackStyle = isIOS
  ? ImpactFeedbackStyle.Medium
  : ImpactFeedbackStyle.Light // Users said the medium impact was too strong on Android; see APP-537s

export class Haptics {
  static default() {
    if (isWeb) {
      return
    }
    impactAsync(impactStyle)
  }
  static impact(type: ImpactFeedbackStyle = impactStyle) {
    if (isWeb) {
      return
    }
    impactAsync(type)
  }
  static selection() {
    if (isWeb) {
      return
    }
    selectionAsync()
  }
  static notification = (type: 'success' | 'warning' | 'error') => {
    if (isWeb) {
      return
    }
    switch (type) {
      case 'success':
        notificationAsync(NotificationFeedbackType.Success)
        return
      case 'warning':
        notificationAsync(NotificationFeedbackType.Warning)
        return
      case 'error':
        notificationAsync(NotificationFeedbackType.Error)
        return
    }
  }
}
