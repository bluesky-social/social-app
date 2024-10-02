import React from 'react'
import {
  GestureResponderEvent,
  MeasureOnSuccessCallback,
  NativeMouseEvent,
  NativeSyntheticEvent,
  PressableProps,
} from 'react-native'
import {Pressable as BSPressable} from 'react-native-gesture-handler'
import {PressableEvent} from 'react-native-gesture-handler/lib/typescript/components/Pressable/PressableProps'

function pressableEventToGestureResponderEvent(
  event: PressableEvent,
  target: NormalizedRNGHPressable,
): GestureResponderEvent {
  return {
    nativeEvent: {
      ...event.nativeEvent,
      touches: [],
      changedTouches: [],
      identifier: event.nativeEvent.identifier.toString(),
      target: event.nativeEvent.target.toString(),
    },
    // @ts-expect-error
    target: target,
    // @ts-expect-error
    currentTarget: target,
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
  target: NormalizedRNGHPressable,
): MouseEvent & NativeSyntheticEvent<NativeMouseEvent> {
  return {
    ...event.nativeEvent,
    // @ts-expect-error
    target: target,
    // @ts-expect-error
    currentTarget: target,
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

export class NormalizedRNGHPressable extends React.Component<PressableProps> {
  static displayName = 'Pressable'

  measure = (_: MeasureOnSuccessCallback) => {}

  measureLayout = (_: number) => {}

  measureInWindow = (
    _: (x: number, y: number, width: number, height: number) => void,
  ) => {}

  setNativeProps = (_: PressableProps) => {}

  focus = () => {}

  blur = () => {}

  onPress = (event: PressableEvent) => {
    if (!this.props.onPress) return
    this.props.onPress(pressableEventToGestureResponderEvent(event, this))
  }

  onLongPress = (event: PressableEvent) => {
    if (!this.props.onLongPress) return
    this.props.onLongPress(pressableEventToGestureResponderEvent(event, this))
  }

  onPressIn = (event: PressableEvent) => {
    if (!this.props.onPressIn) return
    this.props.onPressIn(pressableEventToGestureResponderEvent(event, this))
  }

  onPressOut = (event: PressableEvent) => {
    if (!this.props.onPressOut) return
    this.props.onPressOut(pressableEventToGestureResponderEvent(event, this))
  }

  onHoverIn = (event: PressableEvent) => {
    if (!this.props.onHoverIn) return
    this.props.onHoverIn(pressableEventToMouseEvent(event, this))
  }

  onHoverOut = (event: PressableEvent) => {
    if (!this.props.onHoverOut) return
    this.props.onHoverOut(pressableEventToMouseEvent(event, this))
  }

  render() {
    return (
      <BSPressable
        {...this.props}
        onPress={this.onPress}
        onLongPress={this.onLongPress}
        onPressIn={this.onPressIn}
        onPressOut={this.onPressOut}
        onHoverIn={this.onHoverIn}
        onHoverOut={this.onHoverOut}
      />
    )
  }
}
