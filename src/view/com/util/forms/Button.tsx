import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import {Text} from '../text/Text'
import {useTheme} from 'lib/ThemeContext'
import {choose} from 'lib/functions'

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'default'
  | 'inverted'
  | 'primary-outline'
  | 'secondary-outline'
  | 'primary-light'
  | 'secondary-light'
  | 'default-light'

export function Button({
  type = 'primary',
  label,
  style,
  onPress,
  children,
}: React.PropsWithChildren<{
  type?: ButtonType
  label?: string
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}>) {
  const theme = useTheme()
  const outerStyle = choose<ViewStyle, Record<ButtonType, ViewStyle>>(type, {
    primary: {
      backgroundColor: theme.palette.primary.background,
    },
    secondary: {
      backgroundColor: theme.palette.secondary.background,
    },
    default: {
      backgroundColor: theme.palette.default.backgroundLight,
    },
    inverted: {
      backgroundColor: theme.palette.inverted.background,
    },
    'primary-outline': {
      backgroundColor: theme.palette.default.background,
      borderWidth: 1,
      borderColor: theme.palette.primary.border,
    },
    'secondary-outline': {
      backgroundColor: theme.palette.default.background,
      borderWidth: 1,
      borderColor: theme.palette.secondary.border,
    },
    'primary-light': {
      backgroundColor: theme.palette.default.background,
    },
    'secondary-light': {
      backgroundColor: theme.palette.default.background,
    },
    'default-light': {
      backgroundColor: theme.palette.default.background,
    },
  })
  const labelStyle = choose<TextStyle, Record<ButtonType, TextStyle>>(type, {
    primary: {
      color: theme.palette.primary.text,
      fontWeight: '600',
    },
    secondary: {
      color: theme.palette.secondary.text,
      fontWeight: theme.palette.secondary.isLowContrast ? '500' : undefined,
    },
    default: {
      color: theme.palette.default.text,
    },
    inverted: {
      color: theme.palette.inverted.text,
      fontWeight: '600',
    },
    'primary-outline': {
      color: theme.palette.primary.textInverted,
      fontWeight: theme.palette.primary.isLowContrast ? '500' : undefined,
    },
    'secondary-outline': {
      color: theme.palette.secondary.textInverted,
      fontWeight: theme.palette.secondary.isLowContrast ? '500' : undefined,
    },
    'primary-light': {
      color: theme.palette.primary.textInverted,
      fontWeight: theme.palette.primary.isLowContrast ? '500' : undefined,
    },
    'secondary-light': {
      color: theme.palette.secondary.textInverted,
      fontWeight: theme.palette.secondary.isLowContrast ? '500' : undefined,
    },
    'default-light': {
      color: theme.palette.default.text,
      fontWeight: theme.palette.default.isLowContrast ? '500' : undefined,
    },
  })
  return (
    <TouchableOpacity
      style={[outerStyle, styles.outer, style]}
      onPress={onPress}>
      {label ? (
        <Text type="button" style={[labelStyle]}>
          {label}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
})
