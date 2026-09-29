import {
  type AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  performAndroidHapticsAsync,
  selectionAsync,
} from 'expo-haptics'

import {type AndroidHaptic, resolveAndroidHaptic} from '#/lib/haptics/android'
import {useHapticsDisabled} from '#/state/preferences/disable-haptics'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'

export {type AndroidHaptic, resolveAndroidHaptic} from '#/lib/haptics/android'

/**
 * A `UIImpactFeedbackGenerator` style, a `UINotificationFeedbackGenerator`
 * type, or `selection` for `UISelectionFeedbackGenerator`.
 */
export type IOSHaptic =
  `${ImpactFeedbackStyle}` | `${NotificationFeedbackType}` | 'selection'

const IOS_IMPACT: Record<`${ImpactFeedbackStyle}`, ImpactFeedbackStyle> = {
  light: ImpactFeedbackStyle.Light,
  medium: ImpactFeedbackStyle.Medium,
  heavy: ImpactFeedbackStyle.Heavy,
  soft: ImpactFeedbackStyle.Soft,
  rigid: ImpactFeedbackStyle.Rigid,
}

const IOS_NOTIFICATION: Record<
  `${NotificationFeedbackType}`,
  NotificationFeedbackType
> = {
  success: NotificationFeedbackType.Success,
  warning: NotificationFeedbackType.Warning,
  error: NotificationFeedbackType.Error,
}

function playIOS(haptic: IOSHaptic) {
  if (haptic === 'selection') return selectionAsync()
  if (haptic in IOS_NOTIFICATION) {
    return notificationAsync(
      IOS_NOTIFICATION[haptic as `${NotificationFeedbackType}`],
    )
  }
  return impactAsync(IOS_IMPACT[haptic as `${ImpactFeedbackStyle}`])
}

function playAndroid(haptic: AndroidHaptic) {
  const resolved = resolveAndroidHaptic(haptic)
  if (!resolved) return Promise.resolve()
  return performAndroidHapticsAsync(resolved as AndroidHaptics)
}

function noop() {}

/**
 * Haptic feedback, described by what just happened rather than how it should
 * feel. Each method maps to the idiomatic haptic on each platform. Does nothing
 * on web, or when the user has disabled haptics.
 *
 * The methods are safe to destructure and to pass to `scheduleOnRN`.
 */
export function useHaptics() {
  const disabled = useHapticsDisabled() || IS_WEB

  function play(ios?: IOSHaptic, android?: AndroidHaptic) {
    if (disabled) return
    // Fire and forget - a haptic that fails to play isn't worth surfacing
    if (IS_IOS && ios) {
      playIOS(ios).catch(noop)
    } else if (IS_ANDROID && android) {
      playAndroid(android).catch(noop)
    }
  }

  return {
    /**
     * A light acknowledgement of a tap, e.g. like, reply, or opening a card.
     */
    tap: () => play('light', 'context-click'),
    /**
     * The user committed a change, e.g. follow, pin a feed, or send a message.
     */
    confirm: () => play('medium', 'confirm'),
    /**
     * A long-press did something, e.g. opened a menu or the share sheet.
     */
    longPress: () => play('heavy', 'long-press'),
    /**
     * A switch, checkbox or radio button changed. Pass the new value.
     */
    toggle: (on: boolean) => play('light', on ? 'toggle-on' : 'toggle-off'),
    /**
     * The highlighted option changed, e.g. a segmented control, the menu item
     * under the user's finger, or the slot a dragged item is over.
     */
    selection: () => play('light', 'segment-tick'),
    /**
     * A gesture crossed the point where releasing will trigger its action, e.g.
     * swipe-to-reply.
     */
    // TODO: use `gesture-threshold-activate` on Android once expo-haptics exposes it
    threshold: () => play('medium', 'context-click'),
    /**
     * An item was picked up to be dragged.
     */
    dragStart: () => play('medium', 'drag-start'),
    /**
     * Something the user was waiting on finished successfully.
     */
    success: () => play('success', 'confirm'),
    /**
     * Something the user was waiting on failed.
     */
    error: () => play('error', 'reject'),
    /**
     * Escape hatch for when none of the above fit. Omit a platform to play
     * nothing there. Android constants fall back like the methods above.
     */
    platform: ({ios, android}: {ios?: IOSHaptic; android?: AndroidHaptic}) =>
      play(ios, android),
  }
}
