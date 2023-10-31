import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s} from 'lib/styles'

interface Props {
  text: string
  variant?: 'normal' | 'dark'
  icon?: React.ReactNode
  spinnerAsIcon?: boolean
  width?: number | 'flex' | 'auto'
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

export const SmartSmallButton = ({
  text,
  variant: _variant,
  icon,
  spinnerAsIcon,
  width: _width,
  disabled,
  onPress,
  style,
}: Props) => {
  const pal = usePalette('primary')
  const variant = _variant ? _variant : 'normal'
  const width = _width ? _width : 'auto'

  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.container,
        style,
        variant === 'normal' ? pal.viewInvertedLight : pal.viewInverted,
        width === 'flex' && s.flex1,
        typeof width === 'number' && {width},
        disabled && s.op50,
      ]}
      onPress={onPress}>
      {spinnerAsIcon ? (
        <ActivityIndicator size="small" color={pal.textLight.color} />
      ) : (
        icon
      )}

      <Text type="sm" style={variant === 'dark' ? pal.textInverted : pal.text}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
})
