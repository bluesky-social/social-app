import {
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import {choose} from '#/lib/functions'
import {colors} from '#/lib/styles'
import {useTheme} from '#/lib/ThemeContext'
import {type TypographyVariant} from '#/lib/ThemeContext'
import {Text} from '../text/Text'
import {Button, type ButtonType} from './Button'

/**
 * @deprecated use Toggle from `#/components/form/Toggle.tsx` instead
 */
export function ToggleButton({
  testID,
  type = 'default-light',
  label,
  isSelected,
  style,
  labelType,
  onPress,
}: {
  testID?: string
  type?: ButtonType
  label: string
  isSelected: boolean
  style?: StyleProp<ViewStyle>
  labelType?: TypographyVariant
  onPress?: () => void
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
      borderColor: theme.palette.default.border,
    },
  })
  const circleFillStyle = choose<TextStyle, Record<ButtonType, TextStyle>>(
    type,
    {
      primary: {
        backgroundColor: theme.palette.primary.text,
        opacity: isSelected ? 1 : 0.33,
      },
      secondary: {
        backgroundColor: theme.palette.secondary.text,
        opacity: isSelected ? 1 : 0.33,
      },
      inverted: {
        backgroundColor: theme.palette.inverted.text,
        opacity: isSelected ? 1 : 0.33,
      },
      'primary-outline': {
        backgroundColor: theme.palette.primary.background,
        opacity: isSelected ? 1 : 0.5,
      },
      'secondary-outline': {
        backgroundColor: theme.palette.secondary.background,
        opacity: isSelected ? 1 : 0.5,
      },
      'primary-light': {
        backgroundColor: theme.palette.primary.background,
        opacity: isSelected ? 1 : 0.5,
      },
      'secondary-light': {
        backgroundColor: theme.palette.secondary.background,
        opacity: isSelected ? 1 : 0.5,
      },
      default: {
        backgroundColor: isSelected
          ? theme.palette.primary.background
          : colors.gray3,
      },
      'default-light': {
        backgroundColor: isSelected
          ? theme.palette.primary.background
          : colors.gray3,
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
          <View
            style={[
              circleFillStyle,
              styles.circleFill,
              isSelected ? styles.circleFillSelected : undefined,
            ]}
          />
        </View>
        {label === '' ? null : (
          <Text type={labelType || 'button'} style={[labelStyle, styles.label]}>
            {label}
          </Text>
        )}
      </View>
    </Button>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 42,
    height: 26,
    borderRadius: 15,
    padding: 3,
    borderWidth: 2,
  },
  circleFill: {
    width: 16,
    height: 16,
    borderRadius: 10,
  },
  circleFillSelected: {
    marginLeft: 16,
  },
  label: {
    flex: 1,
  },
})
