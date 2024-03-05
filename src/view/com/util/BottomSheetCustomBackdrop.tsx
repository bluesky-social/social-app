import React, {useMemo} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {t} from '@lingui/macro'
import {BottomSheetBackdropProps} from '@discord/bottom-sheet/src'

export function createCustomBackdrop(
  onClose?: (() => void) | undefined,
): React.FC<BottomSheetBackdropProps> {
  const CustomBackdrop = ({animatedIndex, style}: BottomSheetBackdropProps) => {
    // animated variables
    const opacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.value, // current snap index
        [-1, 0], // input range
        [0, 0.5], // output range
        Extrapolate.CLAMP,
      ),
    }))

    const containerStyle = useMemo(
      () => [style, {backgroundColor: '#000'}, opacity],
      [style, opacity],
    )

    return (
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityLabel={t`Close bottom drawer`}
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
