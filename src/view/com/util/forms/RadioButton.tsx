import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'

import {choose} from '#/lib/functions'
import {useTheme} from '#/lib/ThemeContext'
import {Text} from '../text/Text'
import {Button, ButtonType} from './Button'

export function RadioButton({
  testID,
  type = 'default-light',
  label,
  isSelected,
  style,
  onPress,
}: {
  testID?: string
  type?: ButtonType
  label: string | JSX.Element
  isSelected: boolean
  style?: StyleProp<ViewStyle>
  onPress: () => void
}) {
  const theme = useTheme()
  const circleStyle = choose<TextStyle, Record<ButtonType, TextStyle>>(type, {
    primary: {
      borderColor: theme.palette.primary.text,
    },
    secondary: {
      borderColor: theme.palette.secondary.text,
    },
    inverted: {
      borderColor: theme.palette.inverted.text,
    },
    'primary-outline': {
      borderColor: theme.palette.primary.border,
    },
    'secondary-outline': {
      borderColor: theme.palette.secondary.border,
    },
    'primary-light': {
      borderColor: theme.palette.primary.border,
    },
    'secondary-light': {
      borderColor: theme.palette.secondary.border,
    },
    default: {
      borderColor: theme.palette.default.border,
    },
    'default-light': {
      borderColor: theme.palette.default.borderDark,
    },
  })
  const circleFillStyle = choose<TextStyle, Record<ButtonType, TextStyle>>(
    type,
    {
      primary: {
        backgroundColor: theme.palette.primary.text,
      },
      secondary: {
        backgroundColor: theme.palette.secondary.text,
      },
      inverted: {
        backgroundColor: theme.palette.inverted.text,
      },
      'primary-outline': {
        backgroundColor: theme.palette.primary.background,
      },
      'secondary-outline': {
        backgroundColor: theme.palette.secondary.background,
      },
      'primary-light': {
        backgroundColor: theme.palette.primary.background,
      },
      'secondary-light': {
        backgroundColor: theme.palette.secondary.background,
      },
      default: {
        backgroundColor: theme.palette.primary.background,
      },
      'default-light': {
        backgroundColor: theme.palette.primary.background,
      },
    },
  )
  const labelStyle = choose<TextStyle, Record<ButtonType, TextStyle>>(type, {
    primary: {
      color: theme.palette.primary.text,
      fontWeight: theme.palette.primary.isLowContrast ? '600' : undefined,
    },
    secondary: {
      color: theme.palette.secondary.text,
      fontWeight: theme.palette.secondary.isLowContrast ? '600' : undefined,
    },
    inverted: {
      color: theme.palette.inverted.text,
      fontWeight: theme.palette.inverted.isLowContrast ? '600' : undefined,
    },
    'primary-outline': {
      color: theme.palette.primary.textInverted,
      fontWeight: theme.palette.primary.isLowContrast ? '600' : undefined,
    },
    'secondary-outline': {
      color: theme.palette.secondary.textInverted,
      fontWeight: theme.palette.secondary.isLowContrast ? '600' : undefined,
    },
    'primary-light': {
      color: theme.palette.primary.textInverted,
      fontWeight: theme.palette.primary.isLowContrast ? '600' : undefined,
    },
    'secondary-light': {
      color: theme.palette.secondary.textInverted,
      fontWeight: theme.palette.secondary.isLowContrast ? '600' : undefined,
    },
    default: {
      color: theme.palette.default.text,
      fontWeight: theme.palette.default.isLowContrast ? '600' : undefined,
    },
    'default-light': {
      color: theme.palette.default.text,
      fontWeight: theme.palette.default.isLowContrast ? '600' : undefined,
    },
  })
  return (
    <Button testID={testID} type={type} onPress={onPress} style={style}>
      <View style={styles.outer}>
        <View style={[circleStyle, styles.circle]}>
          {isSelected ? (
            <View style={[circleFillStyle, styles.circleFill]} />
          ) : undefined}
        </View>
        {typeof label === 'string' ? (
          <Text type="button" style={[labelStyle, styles.label]}>
            {label}
          </Text>
        ) : (
          <View style={styles.label}>{label}</View>
        )}
      </View>
    </Button>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 15,
    padding: 4,
    borderWidth: 1,
    marginRight: 10,
  },
  circleFill: {
    width: 16,
    height: 16,
    borderRadius: 10,
  },
  label: {
    flex: 1,
  },
})
