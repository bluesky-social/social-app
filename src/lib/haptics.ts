import { isIOS } from 'platform/detection'
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback'


const hapticImpact: HapticFeedbackTypes = isIOS ? 'impactMedium' : 'impactLight' // Users said the medium impact was too strong on Android; see APP-537s


export class Haptics {
  static default = () => ReactNativeHapticFeedback.trigger(hapticImpact)
  static impact = (type: HapticFeedbackTypes = hapticImpact) => ReactNativeHapticFeedback.trigger(type)
  static selection = () => ReactNativeHapticFeedback.trigger('selection')
  static notification = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return ReactNativeHapticFeedback.trigger('notificationSuccess')
      case 'warning':
        return ReactNativeHapticFeedback.trigger('notificationWarning')
      case 'error':
        return ReactNativeHapticFeedback.trigger('notificationError')
    }
  }
}