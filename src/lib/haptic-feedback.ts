import {useMemo} from 'react'
import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  performAndroidHapticsAsync,
} from 'expo-haptics'

import {useHapticsDisabled} from '#/state/preferences'
import {IS_ANDROID, IS_IOS, IS_WEB} from '#/env'

export enum IOS_HAPTICS {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Rigid = 'rigid',
  Soft = 'soft',
}

export enum ANDROID_HAPTICS {
  ClockTick = 'clock-tick',
  Confirm = 'confirm',
  ContextClick = 'context-click',
  DragStart = 'drag-start',
  GestureEnd = 'gesture-end',
  GestureStart = 'gesture-start',
  KeyboardPress = 'keyboard-press',
  KeyboardRelease = 'keyboard-release',
  KeyboardTap = 'keyboard-tap',
  LongPress = 'long-press',
  Reject = 'reject',
  SegmentFrequentTick = 'segment-frequent-tick',
  SegmentTick = 'segment-tick',
  TextHandleMove = 'text-handle-move',
  ToggleOff = 'toggle-off',
  ToggleOn = 'toggle-on',
  VirtualKey = 'virtual-key',
  VirtualKeyRelease = 'virtual-key-release',
}

const IOS_TO_IMPACT: Record<IOS_HAPTICS, ImpactFeedbackStyle> = {
  [IOS_HAPTICS.Light]: ImpactFeedbackStyle.Light,
  [IOS_HAPTICS.Medium]: ImpactFeedbackStyle.Medium,
  [IOS_HAPTICS.Heavy]: ImpactFeedbackStyle.Heavy,
  [IOS_HAPTICS.Rigid]: ImpactFeedbackStyle.Rigid,
  [IOS_HAPTICS.Soft]: ImpactFeedbackStyle.Soft,
}

const ANDROID_TO_HAPTICS: Record<ANDROID_HAPTICS, AndroidHaptics> = {
  [ANDROID_HAPTICS.ClockTick]: AndroidHaptics.Clock_Tick,
  [ANDROID_HAPTICS.Confirm]: AndroidHaptics.Confirm,
  [ANDROID_HAPTICS.ContextClick]: AndroidHaptics.Context_Click,
  [ANDROID_HAPTICS.DragStart]: AndroidHaptics.Drag_Start,
  [ANDROID_HAPTICS.GestureEnd]: AndroidHaptics.Gesture_End,
  [ANDROID_HAPTICS.GestureStart]: AndroidHaptics.Gesture_Start,
  [ANDROID_HAPTICS.KeyboardPress]: AndroidHaptics.Keyboard_Press,
  [ANDROID_HAPTICS.KeyboardRelease]: AndroidHaptics.Keyboard_Release,
  [ANDROID_HAPTICS.KeyboardTap]: AndroidHaptics.Keyboard_Tap,
  [ANDROID_HAPTICS.LongPress]: AndroidHaptics.Long_Press,
  [ANDROID_HAPTICS.Reject]: AndroidHaptics.Reject,
  [ANDROID_HAPTICS.SegmentFrequentTick]: AndroidHaptics.Segment_Frequent_Tick,
  [ANDROID_HAPTICS.SegmentTick]: AndroidHaptics.Segment_Tick,
  [ANDROID_HAPTICS.TextHandleMove]: AndroidHaptics.Text_Handle_Move,
  [ANDROID_HAPTICS.ToggleOff]: AndroidHaptics.Toggle_Off,
  [ANDROID_HAPTICS.ToggleOn]: AndroidHaptics.Toggle_On,
  [ANDROID_HAPTICS.VirtualKey]: AndroidHaptics.Virtual_Key,
  [ANDROID_HAPTICS.VirtualKeyRelease]: AndroidHaptics.Virtual_Key_Release,
}

async function noop() {}

export function useHapticFeedback() {
  const isHapticsDisabled = useHapticsDisabled()

  return useMemo(() => {
    const disabled = IS_WEB || isHapticsDisabled

    if (disabled) {
      return {
        success: noop,
        error: noop,
        platform: noop,
      }
    }

    return {
      success: async () => {
        if (IS_IOS) {
          await notificationAsync(NotificationFeedbackType.Success)
        } else {
          await performAndroidHapticsAsync(AndroidHaptics.Confirm)
        }
      },
      error: async () => {
        if (IS_IOS) {
          await notificationAsync(NotificationFeedbackType.Error)
        } else {
          await performAndroidHapticsAsync(AndroidHaptics.Reject)
        }
      },
      platform: async (opts: {
        ios?: IOS_HAPTICS
        android?: ANDROID_HAPTICS
      }) => {
        if (IS_IOS && opts.ios != null) {
          await impactAsync(IOS_TO_IMPACT[opts.ios])
        } else if (IS_ANDROID && opts.android != null) {
          await performAndroidHapticsAsync(ANDROID_TO_HAPTICS[opts.android])
        }
      },
    }
  }, [isHapticsDisabled])
}
