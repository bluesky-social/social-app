import { requireNativeViewManager } from 'expo-modules-core'
import * as React from 'react'

import {
  ExpoProTextLayoutEvent,
  ExpoProTextNativeViewProps,
  ExpoProTextPressEvent,
  ExpoProTextSegment,
  ExpoProTextViewProps,
} from './ExpoProText.types'
import { Text, View } from 'react-native'

const NativeView: React.ComponentType<ExpoProTextNativeViewProps> =
  requireNativeViewManager('ExpoProText')

export default function ExpoProTextView({
  style,
  children,
  selectable = false,
  onPress,
  onLongPress,
}: ExpoProTextViewProps) {
  const [dims, setDims] = React.useState({ height: 0 })
  const segmentPressCallbacks = React.useRef<
    Array<{ index: number; onPress: () => void }>
  >([])
  const segmentLongPressCallbacks = React.useRef<
    Array<{ index: number, onLongPress: () => void, }>
  >([])

  const onTextLayout = React.useCallback((e: ExpoProTextLayoutEvent) => {
    setDims({
      height: e.nativeEvent.height,
    })
  }, [])

  const onTextPress = React.useCallback((e: ExpoProTextPressEvent) => {
    console.log(e.nativeEvent)
    const onPressSegment = segmentPressCallbacks.current.find(
      (s) => s.index === e.nativeEvent.index,
    )
    onPressSegment?.onPress()
  }, [])

  const textSegments = React.useMemo(() => {
    const segments: ExpoProTextSegment[] = []

    for (const [index, child] of React.Children.toArray(children).entries()) {
      if (typeof child === 'string') {
        segments.push({
          index,
          text: child,
          style,
          handlePress: onPress !== undefined,
          handleLongPress: onLongPress !== undefined,
        })
      } else if (
        React.isValidElement(child) &&
        (child as React.ReactElement<any>).type === Text
      ) {
        const { onPress, onLongPress, children, style } = child.props

        segments.push({
          index,
          text: children,
          style,
          handlePress: onPress !== undefined,
          handleLongPress: onLongPress !== undefined,
        })

        if (onPress !== undefined) {
          segmentPressCallbacks.current.push({
            index,
            onPress,
          })
        }

        if (onLongPress !== undefined) {
          segmentLongPressCallbacks.current.push({
            index,
            onLongPress,
          })
        }
      }
    }

    return segments
  }, [children])

  const segmentsJson = React.useMemo(() => {
    const json = JSON.stringify({ segments: textSegments })
    console.log(json)
    return json
  }, [textSegments])

  return (
    <View style={dims}>
      <NativeView
        textStyle={style}
        segments={segmentsJson}
        selectable={selectable}
        onTextPress={onTextPress}
        onTextLongPress={onLongPress}
        onTextLayout={onTextLayout}
        disableLongPress={onLongPress !== undefined}
      />
    </View>
  )
}
