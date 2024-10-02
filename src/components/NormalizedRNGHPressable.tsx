import React from 'react'
import {
  GestureResponderEvent,
  NativeMouseEvent,
  NativeSyntheticEvent,
  PressableProps,
  View,
} from 'react-native'
import {Pressable as BSPressable} from 'react-native-gesture-handler'
import {PressableEvent} from 'react-native-gesture-handler/lib/typescript/components/Pressable/PressableProps'

function pressableEventToGestureResponderEvent(
  event: PressableEvent,
): GestureResponderEvent {
  return {
    nativeEvent: {
      ...event.nativeEvent,
      touches: [],
      changedTouches: [],
      identifier: event.nativeEvent.identifier.toString(),
      target: event.nativeEvent.target.toString(),
    },
    target: null,
    currentTarget: null,
    preventDefault() {},
    stopPropagation() {},
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    bubbles: false,
    timeStamp: event.nativeEvent.timestamp,
    isDefaultPrevented(): boolean {
      return false
    },
    isPropagationStopped(): boolean {
      return false
    },
    persist() {},
    type: 'press',
  }
}

function pressableEventToMouseEvent(
  event: PressableEvent,
): MouseEvent & NativeSyntheticEvent<NativeMouseEvent> {
  return {
    ...event.nativeEvent,
    target: null,
    currentTarget: null,
    preventDefault() {},
    stopPropagation() {},
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    bubbles: false,
    timeStamp: event.nativeEvent.timestamp,
  }
}

export const NormalizedRNGHPressable = React.forwardRef<View, PressableProps>(
  function NormalizedPressable(
    {
      onPress,
      onLongPress,
      onPressIn,
      onPressOut,
      onHoverIn,
      onHoverOut,
      onFocus: _onFocus,
      ...rest
    },
    ref,
  ) {
    const onNormalizedPress = (event: PressableEvent) => {
      if (!onPress) return
      onPress(pressableEventToGestureResponderEvent(event))
    }

    const onNormalizedLongPress = (event: PressableEvent) => {
      if (!onLongPress) return
      onLongPress(pressableEventToGestureResponderEvent(event))
    }

    const onNormalizedPressIn = (event: PressableEvent) => {
      if (!onPressIn) return
      onPressIn(pressableEventToGestureResponderEvent(event))
    }

    const onNormalizedPressOut = (event: PressableEvent) => {
      if (!onPressOut) return
      onPressOut(pressableEventToGestureResponderEvent(event))
    }

    const onNormalizedHoverIn = (event: PressableEvent) => {
      if (!onHoverIn) return
      onHoverIn(pressableEventToMouseEvent(event))
    }

    const onNormalizedHoverOut = (event: PressableEvent) => {
      if (!onHoverOut) return
      onHoverOut(pressableEventToMouseEvent(event))
    }

    return (
      <View ref={ref}>
        <BSPressable
          onPress={onNormalizedPress}
          onLongPress={onNormalizedLongPress}
          onPressIn={onNormalizedPressIn}
          onPressOut={onNormalizedPressOut}
          onHoverIn={onNormalizedHoverIn}
          onHoverOut={onNormalizedHoverOut}
          {...rest}
        />
      </View>
    )
  },
)
