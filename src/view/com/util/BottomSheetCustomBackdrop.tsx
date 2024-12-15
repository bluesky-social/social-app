import React, {useMemo} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {BottomSheetBackdropProps} from '@discord/bottom-sheet/src'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function createCustomBackdrop(
  onClose?: (() => void) | undefined,
): React.FC<BottomSheetBackdropProps> {
  const CustomBackdrop = ({animatedIndex, style}: BottomSheetBackdropProps) => {
    const {_} = useLingui()

    // animated variables
    const opacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.get(), // current snap index
        [-1, 0], // input range
        [0, 0.5], // output range
        Extrapolation.CLAMP,
      ),
    }))

    const containerStyle = useMemo(
      () => [style, {backgroundColor: '#000'}, opacity],
      [style, opacity],
    )

    return (
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityLabel={_(msg`Close bottom drawer`)}
        accessibilityHint=""
        onAccessibilityEscape={() => {
          if (onClose !== undefined) {
            onClose()
          }
        }}>
        <Animated.View style={containerStyle} />
      </TouchableWithoutFeedback>
    )
  }
  return CustomBackdrop
}
