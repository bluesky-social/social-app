import {requireNativeViewManager} from 'expo-modules-core'
import * as React from 'react'

import {
  ExpoProTextLayoutEvent,
  ExpoProTextNativeViewProps,
  ExpoProTextPressEvent,
  ExpoProTextSegment,
  ExpoProTextViewProps,
} from './ExpoSelectableText.types'
import {StyleSheet, Text, View} from 'react-native'

const NativeView: React.ComponentType<ExpoProTextNativeViewProps> =
  requireNativeViewManager('ExpoSelectableText')

export default function ExpoSelectableTextView({
  style,
  children,
  selectable = false,
  onPress,
  onLongPress,
}: ExpoProTextViewProps) {
  const [dims, setDims] = React.useState({height: 0})
  const segmentPressCallbacks = React.useRef<
    Array<{index: number; onPress: () => void}>
  >([])
  const segmentLongPressCallbacks = React.useRef<
    Array<{index: number; onLongPress: () => void}>
  >([])

  const onTextLayout = React.useCallback((e: ExpoProTextLayoutEvent) => {
    console.log('layout')
    setDims({
      height: e.nativeEvent.height,
    })
  }, [])

  const onTextPress = React.useCallback((e: ExpoProTextPressEvent) => {
    const onPressSegment = segmentPressCallbacks.current.find(
      s => s.index === e.nativeEvent.index,
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
        const {onPress, onLongPress, children, style} = child.props

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
    const json = JSON.stringify({segments: textSegments})
    return json
  }, [textSegments])

  const rootStyle = React.useMemo(() => {
    return style ? JSON.stringify(style) : undefined
  }, [style])

  return (
    <View style={[dims, {width: '100%'}]}>
      <NativeView
        segments={segmentsJson}
        selectable={selectable}
        onTextPress={onTextPress}
        onTextLongPress={onLongPress}
        onTextLayout={onTextLayout}
        disableLongPress={onLongPress !== undefined}
        style={{flex: 1}}
        rootStyle={rootStyle}
      />
    </View>
  )
}
