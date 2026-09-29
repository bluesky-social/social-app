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

type Haptic = {ios?: IOSHaptic; android?: AndroidHaptic}

/**
 * What each intent plays on each platform. Exported for the Storybook; use
 * `useHaptics` to actually play them.
 */
export const HAPTIC_INTENTS = {
  tap: {ios: 'light', android: 'context-click'},
  confirm: {ios: 'medium', android: 'confirm'},
  longPress: {ios: 'heavy', android: 'long-press'},
  toggleOn: {ios: 'light', android: 'toggle-on'},
  toggleOff: {ios: 'light', android: 'toggle-off'},
  selection: {ios: 'light', android: 'segment-tick'},
  // TODO: use `gesture-threshold-activate` on Android once expo-haptics exposes it
  threshold: {ios: 'medium', android: 'context-click'},
  dragStart: {ios: 'medium', android: 'drag-start'},
  success: {ios: 'success', android: 'confirm'},
  error: {ios: 'error', android: 'reject'},
} satisfies Record<string, Required<Haptic>>

/**
 * Haptic feedback, described by what just happened rather than how it should
 * feel. Each method maps to the idiomatic haptic on each platform. Does nothing
 * on web, or when the user has disabled haptics.
 *
 * The methods are safe to destructure and to pass to `scheduleOnRN`.
 */
export function useHaptics() {
  const disabled = useHapticsDisabled() || IS_WEB

  function play({ios, android}: Haptic) {
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
    tap: () => play(HAPTIC_INTENTS.tap),
    /**
     * The user committed a change, e.g. follow, pin a feed, or send a message.
     */
    confirm: () => play(HAPTIC_INTENTS.confirm),
    /**
     * A long-press did something, e.g. opened a menu or the share sheet.
     */
    longPress: () => play(HAPTIC_INTENTS.longPress),
    /**
     * A switch, checkbox or radio button changed. Pass the new value.
     */
    toggle: (on: boolean) =>
      play(on ? HAPTIC_INTENTS.toggleOn : HAPTIC_INTENTS.toggleOff),
    /**
     * The highlighted option changed, e.g. a segmented control, the menu item
     * under the user's finger, or the slot a dragged item is over.
     */
    selection: () => play(HAPTIC_INTENTS.selection),
    /**
     * A gesture crossed the point where releasing will trigger its action, e.g.
     * swipe-to-reply.
     */
    threshold: () => play(HAPTIC_INTENTS.threshold),
    /**
     * An item was picked up to be dragged.
     */
    dragStart: () => play(HAPTIC_INTENTS.dragStart),
    /**
     * Something the user was waiting on finished successfully.
     */
    success: () => play(HAPTIC_INTENTS.success),
    /**
     * Something the user was waiting on failed.
     */
    error: () => play(HAPTIC_INTENTS.error),
    /**
     * Escape hatch for when none of the above fit. Omit a platform to play
     * nothing there. Android constants fall back like the methods above.
     */
    platform: (haptic: Haptic) => play(haptic),
  }
}
