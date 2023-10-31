import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'

interface Props {
  text: string
  variant?: 'filled' | 'empty'
  icon?: React.ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

export const LargeButton = ({
  text,
  variant: _variant,
  icon,
  onPress,
  style,
}: Props) => {
  const pal = usePalette('primary')
  const variant = _variant ? _variant : 'filled'

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.container,
        style,
        variant === 'filled' && pal.viewInverted,
        variant === 'empty' && [pal.borderDark, s.border2],
      ]}
      onPress={onPress}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        type="lg"
        style={[
          s.flex1,
          s.textCenter,
          variant === 'filled' ? pal.textInverted : pal.textLight,
        ]}>
        {text}
      </Text>
      {icon && <View style={styles.iconContainer} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 25,
    paddingHorizontal: 7,
  },
  iconContainer: {
    width: 24,
  },
})
