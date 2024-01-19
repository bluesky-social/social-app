import React from 'react'
import {
  Pressable,
  Text,
  PressableProps,
  TextProps,
  ViewStyle,
  AccessibilityProps,
  View,
  TextStyle,
  StyleSheet,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {useTheme, atoms as a, tokens, web, native} from '#/alf'
import {Props as SVGIconProps} from '#/components/icons/common'

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

export type ButtonProps = React.PropsWithChildren<
  Pick<PressableProps, 'disabled' | 'onPress'> &
    AccessibilityProps &
    VariantProps & {
      label: string
    }
>
export type ButtonTextProps = TextProps & VariantProps & {disabled?: boolean}

const Context = React.createContext<
  VariantProps & {
    hovered: boolean
    focused: boolean
    pressed: boolean
    disabled: boolean
  }
>({
  hovered: false,
  focused: false,
  pressed: false,
  disabled: false,
})

export function useButtonContext() {
  return React.useContext(Context)
}

export function Button({
  children,
  variant,
  color,
  size,
  label,
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
        baseStyles.push(a.border, t.atoms.bg, {
          borderWidth: 1,
        })

        if (!disabled) {
          baseStyles.push(a.border, {
            borderColor: tokens.color.blue_500,
          })
          hoverStyles.push(a.border, {
            backgroundColor: light
              ? t.palette.primary_50
              : t.palette.primary_950,
          })
        } else {
          baseStyles.push(a.border, {
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
              ? tokens.color.gray_100
              : tokens.color.gray_900,
          })
          hoverStyles.push({
            backgroundColor: light
              ? tokens.color.gray_200
              : tokens.color.gray_950,
          })
        } else {
          baseStyles.push({
            backgroundColor: light
              ? tokens.color.gray_300
              : tokens.color.gray_950,
          })
        }
      } else if (variant === 'outline') {
        baseStyles.push(a.border, t.atoms.bg, {
          borderWidth: 1,
        })

        if (!disabled) {
          baseStyles.push(a.border, {
            borderColor: light ? tokens.color.gray_500 : tokens.color.gray_500,
          })
          hoverStyles.push(a.border, t.atoms.bg_contrast_50)
        } else {
          baseStyles.push(a.border, {
            borderColor: light ? tokens.color.gray_200 : tokens.color.gray_800,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push(t.atoms.bg)
          hoverStyles.push({
            backgroundColor: light
              ? tokens.color.gray_100
              : tokens.color.gray_900,
          })
        }
      }
    } else if (color === 'negative') {
      if (variant === 'solid') {
        if (!disabled) {
          baseStyles.push({
            backgroundColor: t.palette.negative_400,
          })
          hoverStyles.push({
            backgroundColor: t.palette.negative_500,
          })
        } else {
          baseStyles.push({
            backgroundColor: t.palette.negative_600,
          })
        }
      } else if (variant === 'outline') {
        baseStyles.push(a.border, t.atoms.bg, {
          borderWidth: 1,
        })

        if (!disabled) {
          baseStyles.push(a.border, {
            borderColor: t.palette.negative_400,
          })
          hoverStyles.push(a.border, {
            backgroundColor: light
              ? t.palette.negative_50
              : t.palette.negative_975,
          })
        } else {
          baseStyles.push(a.border, {
            borderColor: light
              ? t.palette.negative_200
              : t.palette.negative_900,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push(t.atoms.bg)
          hoverStyles.push({
            backgroundColor: light
              ? t.palette.negative_100
              : t.palette.negative_950,
          })
        }
      }
    }

    if (size === 'large') {
      baseStyles.push({paddingVertical: 15}, a.px_2xl, a.rounded_sm, a.gap_sm)
    } else if (size === 'small') {
      baseStyles.push({paddingVertical: 9}, a.px_md, a.rounded_sm, a.gap_sm)
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

  const context = React.useMemo(
    () => ({
      ...state,
      variant,
      color,
      size,
      disabled: disabled || false,
    }),
    [state, variant, color, size, disabled],
  )

  return (
    <Pressable
      role="button"
      accessibilityHint={undefined} // optional
      {...rest}
      aria-label={label}
      aria-pressed={state.pressed}
      accessibilityLabel={label}
      disabled={disabled || false}
      accessibilityState={{
        disabled: disabled || false,
      }}
      style={[
        a.flex_row,
        a.align_center,
        a.overflow_hidden,
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
          style={[a.absolute, a.inset_0]}
        />
      )}
      <Context.Provider value={context}>
        {typeof children === 'string' ? (
          <ButtonText>{children}</ButtonText>
        ) : (
          children
        )}
      </Context.Provider>
    </Pressable>
  )
}

export function useSharedButtonTextStyles() {
  const t = useTheme()
  const {color, variant, disabled, size} = useButtonContext()
  return React.useMemo(() => {
    const baseStyles: TextStyle[] = []
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
          baseStyles.push({color: t.palette.negative_400})
        } else {
          baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push({color: t.palette.negative_400})
        } else {
          baseStyles.push({color: t.palette.negative_400, opacity: 0.5})
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
        a.text_md,
        web({paddingBottom: 1}),
        native({marginTop: 2}),
      )
    } else {
      baseStyles.push(
        a.text_md,
        web({paddingBottom: 1}),
        native({marginTop: 2}),
      )
    }

    return StyleSheet.flatten(baseStyles)
  }, [t, variant, color, size, disabled])
}

export function ButtonText({children, style, ...rest}: ButtonTextProps) {
  const textStyles = useSharedButtonTextStyles()

  return (
    <Text {...rest} style={[a.font_bold, a.text_center, textStyles, style]}>
      {children}
    </Text>
  )
}

export function ButtonIcon({
  icon: Comp,
}: {
  icon: React.ComponentType<SVGIconProps>
}) {
  const {size} = useButtonContext()
  const textStyles = useSharedButtonTextStyles()

  return (
    <View style={[a.z_20]}>
      <Comp
        size={size === 'large' ? 'md' : 'sm'}
        style={[{color: textStyles.color, pointerEvents: 'none'}]}
      />
    </View>
  )
}
