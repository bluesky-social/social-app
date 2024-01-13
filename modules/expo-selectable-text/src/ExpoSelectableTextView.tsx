import {requireNativeViewManager} from 'expo-modules-core'
import * as React from 'react'

import {
  ExpoProTextLayoutEvent,
  ExpoProTextNativeViewProps,
  ExpoProTextPressEvent,
  ExpoProTextSegment,
  ExpoProTextViewProps,
} from './ExpoSelectableText.types'
import {StyleSheet, View} from 'react-native'
import {onTextLinkPress, TextLink} from 'view/com/util/Link'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {useModalControls} from 'state/modals'

const NativeView: React.ComponentType<ExpoProTextNativeViewProps> =
  requireNativeViewManager('ExpoSelectableText')

export default function ExpoSelectableTextView({
  style,
  children,
  selectable = true,
  onPress,
  onLongPress,
}: ExpoProTextViewProps) {
  // Dimensions based on the native view's text height
  const [dims, setDims] = React.useState({height: 0})

  // Needed for navigation on link presses
  const navigation = useNavigation<NavigationProp>()
  const {openModal, closeModal} = useModalControls()

  // Store the callbacks for onPress and onLongPress events
  const segmentPressCallbacks = React.useRef<
    Array<{index: number; onPress: () => void}>
  >([])
  const segmentLongPressCallbacks = React.useRef<
    Array<{index: number; onLongPress: () => void}>
  >([])

  // The root style, stringified
  const rootStyle = React.useMemo(() => {
    return style ? JSON.stringify(style) : undefined
  }, [style])

  // The text segments, stringified
  const textSegments = React.useMemo(() => {
    const segments: ExpoProTextSegment[] = []

    for (const [index, child] of React.Children.toArray(children).entries()) {
      // Most of our children will be strings. Simply add them to the segments array.
      if (typeof child === 'string') {
        segments.push({
          index,
          text: child,
          style: style,
          handlePress: onPress !== undefined,
          handleLongPress: onLongPress !== undefined,
        })
      } else if (React.isValidElement(child)) {
        // If it is a child, it is either a nested <Text> or a <TextLink>. Check if the child is a string or a <TextLink>
        // If it's a <TextLink> we need to create on the onPress handler (it won't be created in the component since the
        // component never actually gets rendered)

        const {
          children: innerChildren,
          onLongPress: innerOnLongPress,
          style: innerStyle,
          text: innerText,
          href,
          navigationAction,
          warnOnMismatchingLabel,
        } = child.props
        let innerOnPress = child.props.onPress

        const type = (child as React.ReactElement<any>).type

        if (typeof innerChildren === 'string' || type === TextLink) {
          if (type === TextLink) {
            // Set the onPress handler
            innerOnPress = () => {
              onTextLinkPress({
                openModal,
                closeModal,
                text: innerText,
                navigation,
                href,
                navigationAction,
                warnOnMismatchingLabel,
              })
            }
          }

          // Add the segment to the array
          segments.push({
            index,
            text: innerText ?? innerChildren,
            style: StyleSheet.flatten(innerStyle),
            handlePress: innerOnPress !== undefined,
            handleLongPress: innerOnLongPress !== undefined,
          })

          // If we have press events, push them in
          if (innerOnPress !== undefined) {
            segmentPressCallbacks.current.push({
              index,
              onPress: innerOnPress,
            })
          }
          if (onLongPress !== undefined) {
            segmentLongPressCallbacks.current.push({
              index,
              onLongPress: innerOnLongPress,
            })
          }
        }
      }
    }

    return segments
  }, [children, closeModal, navigation, onLongPress, onPress, openModal, style])

  const segmentsJson = React.useMemo(() => {
    return JSON.stringify({segments: textSegments})
  }, [textSegments])

  const onTextLayout = React.useCallback((e: ExpoProTextLayoutEvent) => {
    setDims({
      height: e.nativeEvent.height,
    })
  }, [])

  const onTextPress = React.useCallback(
    (e: ExpoProTextPressEvent) => {
      const onPressSegment =
        segmentPressCallbacks.current.find(s => s.index === e.nativeEvent.index)
          ?.onPress ?? onPress

      onPressSegment?.()
    },
    [onPress],
  )

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
