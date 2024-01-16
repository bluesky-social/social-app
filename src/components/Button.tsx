import React from 'react'
import {
  Pressable,
  Text,
  PressableProps,
  TextProps,
  ViewStyle,
  AccessibilityProps,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {useTheme, atoms, tokens, web, native} from '#/alf'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'gradient'
export type ButtonColor =
  | 'primary'
  | 'secondary'
  | 'negative'
  | 'gradient_sky'
  | 'gradient_midnight'
  | 'gradient_sunrise'
  | 'gradient_sunset'
  | 'gradient_nordic'
  | 'gradient_bonfire'
export type ButtonSize = 'small' | 'large'
export type VariantProps = {
  /**
   * The style variation of the button
   */
  variant?: ButtonVariant
  /**
   * The color of the button
   */
  color?: ButtonColor
  /**
   * The size of the button
   */
  size?: ButtonSize
}

export type ButtonProps = Omit<
  PressableProps,
  'children' | 'style' | 'accessibilityLabel' | 'accessibilityHint'
> &
  VariantProps & {
    children:
      | ((props: {
          state: {
            pressed: boolean
            hovered: boolean
            focused: boolean
          }
          props: VariantProps & {
            disabled?: boolean
          }
        }) => React.ReactNode)
      | React.ReactNode
      | string
    accessibilityLabel: Required<AccessibilityProps>['accessibilityLabel']
    accessibilityHint: Required<AccessibilityProps>['accessibilityHint']
  }
export type ButtonTextProps = TextProps & VariantProps & {disabled?: boolean}

export function Button({
  children,
  variant,
  color,
  size,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  ...rest
}: ButtonProps) {
  const t = useTheme()
  const [state, setState] = React.useState({
    pressed: false,
    hovered: false,
    focused: false,
  })

  const onPressIn = React.useCallback(() => {
    setState(s => ({
      ...s,
      pressed: true,
    }))
  }, [setState])
  const onPressOut = React.useCallback(() => {
    setState(s => ({
      ...s,
      pressed: false,
    }))
  }, [setState])
  const onHoverIn = React.useCallback(() => {
    setState(s => ({
      ...s,
      hovered: true,
    }))
  }, [setState])
  const onHoverOut = React.useCallback(() => {
    setState(s => ({
      ...s,
      hovered: false,
    }))
  }, [setState])
  const onFocus = React.useCallback(() => {
    setState(s => ({
      ...s,
      focused: true,
    }))
  }, [setState])
  const onBlur = React.useCallback(() => {
    setState(s => ({
      ...s,
      focused: false,
    }))
  }, [setState])

  const {baseStyles, hoverStyles, focusStyles} = React.useMemo(() => {
    const baseStyles: ViewStyle[] = []
    const hoverStyles: ViewStyle[] = []
    const light = t.name === 'light'

    if (color === 'primary') {
      if (variant === 'solid') {
        if (!disabled) {
          baseStyles.push({
            backgroundColor: t.palette.primary_500,
          })
          hoverStyles.push({
            backgroundColor: t.palette.primary_600,
          })
        } else {
          baseStyles.push({
            backgroundColor: t.palette.primary_700,
          })
        }
      } else if (variant === 'outline') {
        baseStyles.push(atoms.border, t.atoms.bg, {
          borderWidth: 1,
        })

        if (!disabled) {
          baseStyles.push(atoms.border, {
            borderColor: tokens.color.blue_500,
          })
          hoverStyles.push(atoms.border, {
            backgroundColor: light
              ? t.palette.primary_100
              : t.palette.primary_900,
          })
        } else {
          baseStyles.push(atoms.border, {
            borderColor: light ? tokens.color.blue_200 : tokens.color.blue_900,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push(t.atoms.bg)
          hoverStyles.push({
            backgroundColor: light
              ? t.palette.primary_100
              : t.palette.primary_900,
          })
        }
      }
    } else if (color === 'secondary') {
      if (variant === 'solid') {
        if (!disabled) {
          baseStyles.push({
            backgroundColor: light
              ? tokens.color.gray_200
              : tokens.color.gray_800,
          })
          hoverStyles.push({
            backgroundColor: light
              ? tokens.color.gray_300
              : tokens.color.gray_900,
          })
        } else {
          baseStyles.push({
            backgroundColor: light
              ? tokens.color.gray_300
              : tokens.color.gray_900,
          })
        }
      } else if (variant === 'outline') {
        baseStyles.push(atoms.border, t.atoms.bg, {
          borderWidth: 1,
        })

        if (!disabled) {
          baseStyles.push(atoms.border, {
            borderColor: light ? tokens.color.gray_500 : tokens.color.gray_500,
          })
          hoverStyles.push(atoms.border, t.atoms.bg_contrast_50)
        } else {
          baseStyles.push(atoms.border, {
            borderColor: light ? tokens.color.gray_200 : tokens.color.gray_800,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push(t.atoms.bg)
          hoverStyles.push({
            backgroundColor: light
              ? tokens.color.gray_100
              : tokens.color.gray_800,
          })
        }
      }
    } else if (color === 'negative') {
      if (variant === 'solid') {
        if (!disabled) {
          baseStyles.push({
            backgroundColor: t.palette.negative_500,
          })
          hoverStyles.push({
            backgroundColor: t.palette.negative_600,
          })
        } else {
          baseStyles.push({
            backgroundColor: t.palette.negative_700,
          })
        }
      } else if (variant === 'outline') {
        baseStyles.push(atoms.border, t.atoms.bg, {
          borderWidth: 1,
        })

        if (!disabled) {
          baseStyles.push(atoms.border, {
            borderColor: t.palette.negative_600,
          })
          hoverStyles.push(atoms.border, {
            backgroundColor: light ? t.palette.negative_50 : '#2D0614', // darker red
          })
        } else {
          baseStyles.push(atoms.border, {
            borderColor: light
              ? t.palette.negative_200
              : t.palette.negative_900,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push(t.atoms.bg)
          hoverStyles.push({
            backgroundColor: light ? t.palette.negative_50 : '#2D0614', // darker red
          })
        }
      }
    }

    if (size === 'large') {
      baseStyles.push(
        {paddingVertical: 15},
        atoms.px_2xl,
        atoms.rounded_sm,
        atoms.gap_sm,
      )
    } else if (size === 'small') {
      baseStyles.push(
        {paddingVertical: 9},
        atoms.px_md,
        atoms.rounded_sm,
        atoms.gap_xs,
      )
    }

    return {
      baseStyles,
      hoverStyles,
      focusStyles: [
        ...hoverStyles,
        {
          outline: 0,
        } as ViewStyle,
      ],
    }
  }, [t, variant, color, size, disabled])

  const {gradientColors, gradientHoverColors, gradientLocations} =
    React.useMemo(() => {
      const colors: string[] = []
      const hoverColors: string[] = []
      const locations: number[] = []
      const gradient = {
        primary: tokens.gradients.sky,
        secondary: tokens.gradients.sky,
        negative: tokens.gradients.sky,
        gradient_sky: tokens.gradients.sky,
        gradient_midnight: tokens.gradients.midnight,
        gradient_sunrise: tokens.gradients.sunrise,
        gradient_sunset: tokens.gradients.sunset,
        gradient_nordic: tokens.gradients.nordic,
        gradient_bonfire: tokens.gradients.bonfire,
      }[color || 'primary']

      if (variant === 'gradient') {
        colors.push(...gradient.values.map(([_, color]) => color))
        hoverColors.push(...gradient.values.map(_ => gradient.hover_value))
        locations.push(...gradient.values.map(([location, _]) => location))
      }

      return {
        gradientColors: colors,
        gradientHoverColors: hoverColors,
        gradientLocations: locations,
      }
    }, [variant, color])

  const childProps = React.useMemo(
    () => ({
      state,
      props: {
        variant,
        color,
        size,
        disabled: disabled || false,
      },
    }),
    [state, variant, color, size, disabled],
  )

  return (
    <Pressable
      role="button"
      {...rest}
      aria-label={accessibilityLabel}
      aria-pressed={state.pressed}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled || false}
      accessibilityState={{
        disabled: disabled || false,
      }}
      style={[
        atoms.flex_row,
        atoms.align_center,
        atoms.overflow_hidden,
        ...baseStyles,
        ...(state.hovered || state.pressed ? hoverStyles : []),
        ...(state.focused ? focusStyles : []),
      ]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onFocus={onFocus}
      onBlur={onBlur}>
      {variant === 'gradient' && (
        <LinearGradient
          colors={
            state.hovered || state.pressed || state.focused
              ? gradientHoverColors
              : gradientColors
          }
          locations={gradientLocations}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[atoms.absolute, atoms.inset_0]}
        />
      )}
      {typeof children === 'string' ? (
        <ButtonText
          variant={variant}
          color={color}
          size={size}
          disabled={disabled || false}>
          {children}
        </ButtonText>
      ) : typeof children === 'function' ? (
        children(childProps)
      ) : (
        children
      )}
    </Pressable>
  )
}

export function ButtonText({
  children,
  style,
  variant,
  color,
  size,
  disabled,
  ...rest
}: ButtonTextProps) {
  const t = useTheme()

  const textStyles = React.useMemo(() => {
    const baseStyles = []
    const light = t.name === 'light'

    if (color === 'primary') {
      if (variant === 'solid') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({color: t.palette.white, opacity: 0.5})
        }
      } else if (variant === 'outline') {
        if (!disabled) {
          baseStyles.push({
            color: light ? t.palette.primary_600 : t.palette.primary_500,
          })
        } else {
          baseStyles.push({color: t.palette.primary_600, opacity: 0.5})
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push({color: t.palette.primary_600})
        } else {
          baseStyles.push({color: t.palette.primary_600, opacity: 0.5})
        }
      }
    } else if (color === 'secondary') {
      if (variant === 'solid' || variant === 'gradient') {
        if (!disabled) {
          baseStyles.push({
            color: light ? tokens.color.gray_700 : tokens.color.gray_100,
          })
        } else {
          baseStyles.push({
            color: light ? tokens.color.gray_400 : tokens.color.gray_700,
          })
        }
      } else if (variant === 'outline') {
        if (!disabled) {
          baseStyles.push({
            color: light ? tokens.color.gray_600 : tokens.color.gray_300,
          })
        } else {
          baseStyles.push({
            color: light ? tokens.color.gray_400 : tokens.color.gray_700,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push({
            color: light ? tokens.color.gray_600 : tokens.color.gray_300,
          })
        } else {
          baseStyles.push({
            color: light ? tokens.color.gray_400 : tokens.color.gray_600,
          })
        }
      }
    } else if (color === 'negative') {
      if (variant === 'solid' || variant === 'gradient') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({color: t.palette.white, opacity: 0.5})
        }
      } else if (variant === 'outline') {
        if (!disabled) {
          baseStyles.push({color: t.palette.negative_500})
        } else {
          baseStyles.push({color: t.palette.negative_500, opacity: 0.5})
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push({color: t.palette.negative_500})
        } else {
          baseStyles.push({color: t.palette.negative_500, opacity: 0.5})
        }
      }
    } else {
      if (!disabled) {
        baseStyles.push({color: t.palette.white})
      } else {
        baseStyles.push({color: t.palette.white, opacity: 0.5})
      }
    }

    if (size === 'large') {
      baseStyles.push(
        atoms.text_md,
        web({paddingBottom: 1}),
        native({marginTop: 2}),
      )
    } else {
      baseStyles.push(
        atoms.text_md,
        web({paddingBottom: 1}),
        native({marginTop: 2}),
      )
    }

    return baseStyles
  }, [t, variant, color, size, disabled])

  return (
    <Text
      {...rest}
      style={[atoms.font_bold, atoms.text_center, ...textStyles, style]}>
      {children}
    </Text>
  )
}
