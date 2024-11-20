import React from 'react'
import {
  AccessibilityProps,
  GestureResponderEvent,
  MouseEvent,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'

import {atoms as a, flatten, select, tokens, useTheme} from '#/alf'
import {Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'gradient'
export type ButtonColor =
  | 'primary'
  | 'secondary'
  | 'secondary_inverted'
  | 'negative'
  | 'gradient_primary'
  | 'gradient_sky'
  | 'gradient_midnight'
  | 'gradient_sunrise'
  | 'gradient_sunset'
  | 'gradient_nordic'
  | 'gradient_bonfire'
export type ButtonSize = 'tiny' | 'small' | 'large'
export type ButtonShape = 'round' | 'square' | 'default'
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
  /**
   * The shape of the button
   */
  shape?: ButtonShape
}

export type ButtonState = {
  hovered: boolean
  focused: boolean
  pressed: boolean
  disabled: boolean
}

export type ButtonContext = VariantProps & ButtonState

type NonTextElements =
  | React.ReactElement
  | Iterable<React.ReactElement | null | undefined | boolean>

export type ButtonProps = Pick<
  PressableProps,
  | 'disabled'
  | 'onPress'
  | 'testID'
  | 'onLongPress'
  | 'hitSlop'
  | 'onHoverIn'
  | 'onHoverOut'
  | 'onPressIn'
  | 'onPressOut'
> &
  AccessibilityProps &
  VariantProps & {
    testID?: string
    /**
     * For a11y, try to make this descriptive and clear
     */
    label: string
    style?: StyleProp<ViewStyle>
    hoverStyle?: StyleProp<ViewStyle>
    children: NonTextElements | ((context: ButtonContext) => NonTextElements)
    PressableComponent?: React.ComponentType<PressableProps>
  }

export type ButtonTextProps = TextProps & VariantProps & {disabled?: boolean}

const Context = React.createContext<VariantProps & ButtonState>({
  hovered: false,
  focused: false,
  pressed: false,
  disabled: false,
})

export function useButtonContext() {
  return React.useContext(Context)
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      children,
      variant,
      color,
      size,
      shape = 'default',
      label,
      disabled = false,
      style,
      hoverStyle: hoverStyleProp,
      PressableComponent = Pressable,
      ...rest
    },
    ref,
  ) => {
    const t = useTheme()
    const [state, setState] = React.useState({
      pressed: false,
      hovered: false,
      focused: false,
    })

    const onPressInOuter = rest.onPressIn
    const onPressIn = React.useCallback(
      (e: GestureResponderEvent) => {
        setState(s => ({
          ...s,
          pressed: true,
        }))
        onPressInOuter?.(e)
      },
      [setState, onPressInOuter],
    )
    const onPressOutOuter = rest.onPressOut
    const onPressOut = React.useCallback(
      (e: GestureResponderEvent) => {
        setState(s => ({
          ...s,
          pressed: false,
        }))
        onPressOutOuter?.(e)
      },
      [setState, onPressOutOuter],
    )
    const onHoverInOuter = rest.onHoverIn
    const onHoverIn = React.useCallback(
      (e: MouseEvent) => {
        setState(s => ({
          ...s,
          hovered: true,
        }))
        onHoverInOuter?.(e)
      },
      [setState, onHoverInOuter],
    )
    const onHoverOutOuter = rest.onHoverOut
    const onHoverOut = React.useCallback(
      (e: MouseEvent) => {
        setState(s => ({
          ...s,
          hovered: false,
        }))
        onHoverOutOuter?.(e)
      },
      [setState, onHoverOutOuter],
    )
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

    const {baseStyles, hoverStyles} = React.useMemo(() => {
      const baseStyles: ViewStyle[] = []
      const hoverStyles: ViewStyle[] = []

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
              backgroundColor: select(t.name, {
                light: t.palette.primary_700,
                dim: t.palette.primary_300,
                dark: t.palette.primary_300,
              }),
            })
          }
        } else if (variant === 'outline') {
          baseStyles.push(a.border, t.atoms.bg, {
            borderWidth: 1,
          })

          if (!disabled) {
            baseStyles.push(a.border, {
              borderColor: t.palette.primary_500,
            })
            hoverStyles.push(a.border, {
              backgroundColor: t.palette.primary_50,
            })
          } else {
            baseStyles.push(a.border, {
              borderColor: t.palette.primary_200,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg)
            hoverStyles.push({
              backgroundColor: t.palette.primary_100,
            })
          }
        }
      } else if (color === 'secondary') {
        if (variant === 'solid') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg_contrast_25)
            hoverStyles.push(t.atoms.bg_contrast_50)
          } else {
            baseStyles.push(t.atoms.bg_contrast_100)
          }
        } else if (variant === 'outline') {
          baseStyles.push(a.border, t.atoms.bg, {
            borderWidth: 1,
          })

          if (!disabled) {
            baseStyles.push(a.border, {
              borderColor: t.palette.contrast_300,
            })
            hoverStyles.push(t.atoms.bg_contrast_50)
          } else {
            baseStyles.push(a.border, {
              borderColor: t.palette.contrast_200,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg)
            hoverStyles.push({
              backgroundColor: t.palette.contrast_25,
            })
          }
        }
      } else if (color === 'secondary_inverted') {
        if (variant === 'solid') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.contrast_900,
            })
            hoverStyles.push({
              backgroundColor: t.palette.contrast_950,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.contrast_600,
            })
          }
        } else if (variant === 'outline') {
          baseStyles.push(a.border, t.atoms.bg, {
            borderWidth: 1,
          })

          if (!disabled) {
            baseStyles.push(a.border, {
              borderColor: t.palette.contrast_300,
            })
            hoverStyles.push(t.atoms.bg_contrast_50)
          } else {
            baseStyles.push(a.border, {
              borderColor: t.palette.contrast_200,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg)
            hoverStyles.push({
              backgroundColor: t.palette.contrast_25,
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
              backgroundColor: select(t.name, {
                light: t.palette.negative_700,
                dim: t.palette.negative_300,
                dark: t.palette.negative_300,
              }),
            })
          }
        } else if (variant === 'outline') {
          baseStyles.push(a.border, t.atoms.bg, {
            borderWidth: 1,
          })

          if (!disabled) {
            baseStyles.push(a.border, {
              borderColor: t.palette.negative_500,
            })
            hoverStyles.push(a.border, {
              backgroundColor: t.palette.negative_50,
            })
          } else {
            baseStyles.push(a.border, {
              borderColor: t.palette.negative_200,
            })
          }
        } else if (variant === 'ghost') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg)
            hoverStyles.push({
              backgroundColor: t.palette.negative_100,
            })
          }
        }
      }

      if (shape === 'default') {
        if (size === 'large') {
          baseStyles.push({
            paddingVertical: 13,
            paddingHorizontal: 20,
            borderRadius: 8,
            gap: 8,
          })
        } else if (size === 'small') {
          baseStyles.push({
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: 6,
            gap: 6,
          })
        } else if (size === 'tiny') {
          baseStyles.push({
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 4,
            gap: 4,
          })
        }
      } else if (shape === 'round' || shape === 'square') {
        if (size === 'large') {
          if (shape === 'round') {
            baseStyles.push({height: 46, width: 46})
          } else {
            baseStyles.push({height: 44, width: 44})
          }
        } else if (size === 'small') {
          if (shape === 'round') {
            baseStyles.push({height: 34, width: 34})
          } else {
            baseStyles.push({height: 34, width: 34})
          }
        } else if (size === 'tiny') {
          if (shape === 'round') {
            baseStyles.push({height: 22, width: 22})
          } else {
            baseStyles.push({height: 21, width: 21})
          }
        }

        if (shape === 'round') {
          baseStyles.push(a.rounded_full)
        } else if (shape === 'square') {
          if (size === 'tiny') {
            baseStyles.push(a.rounded_xs)
          } else {
            baseStyles.push(a.rounded_sm)
          }
        }
      }

      return {
        baseStyles,
        hoverStyles,
      }
    }, [t, variant, color, size, shape, disabled])

    const {gradientColors, gradientHoverColors, gradientLocations} =
      React.useMemo(() => {
        const colors: string[] = []
        const hoverColors: string[] = []
        const locations: number[] = []
        const gradient = {
          primary: tokens.gradients.sky,
          secondary: tokens.gradients.sky,
          secondary_inverted: tokens.gradients.sky,
          negative: tokens.gradients.sky,
          gradient_primary: tokens.gradients.primary,
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

    const context = React.useMemo<ButtonContext>(
      () => ({
        ...state,
        variant,
        color,
        size,
        disabled: disabled || false,
      }),
      [state, variant, color, size, disabled],
    )

    const flattenedBaseStyles = flatten([baseStyles, style])

    return (
      <PressableComponent
        role="button"
        accessibilityHint={undefined} // optional
        {...rest}
        // @ts-ignore - this will always be a pressable
        ref={ref}
        aria-label={label}
        accessibilityLabel={label}
        disabled={disabled || false}
        accessibilityState={{
          disabled: disabled || false,
        }}
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          flattenedBaseStyles,
          ...(state.hovered || state.pressed
            ? [hoverStyles, flatten(hoverStyleProp)]
            : []),
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        onFocus={onFocus}
        onBlur={onBlur}>
        {variant === 'gradient' && (
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.overflow_hidden,
              {borderRadius: flattenedBaseStyles.borderRadius},
            ]}>
            <LinearGradient
              colors={
                state.hovered || state.pressed
                  ? gradientHoverColors
                  : gradientColors
              }
              locations={gradientLocations}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[a.absolute, a.inset_0]}
            />
          </View>
        )}
        <Context.Provider value={context}>
          {typeof children === 'function' ? children(context) : children}
        </Context.Provider>
      </PressableComponent>
    )
  },
)
Button.displayName = 'Button'

export function useSharedButtonTextStyles() {
  const t = useTheme()
  const {color, variant, disabled, size} = useButtonContext()
  return React.useMemo(() => {
    const baseStyles: TextStyle[] = []

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
            color: t.palette.primary_600,
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
            color: t.palette.contrast_700,
          })
        } else {
          baseStyles.push({
            color: t.palette.contrast_400,
          })
        }
      } else if (variant === 'outline') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.contrast_600,
          })
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.contrast_600,
          })
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      }
    } else if (color === 'secondary_inverted') {
      if (variant === 'solid' || variant === 'gradient') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.contrast_100,
          })
        } else {
          baseStyles.push({
            color: t.palette.contrast_400,
          })
        }
      } else if (variant === 'outline') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.contrast_600,
          })
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (variant === 'ghost') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.contrast_600,
          })
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
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
      baseStyles.push(a.text_md, a.leading_tight)
    } else if (size === 'small') {
      baseStyles.push(a.text_sm, a.leading_tight)
    } else if (size === 'tiny') {
      baseStyles.push(a.text_xs, a.leading_tight)
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
  position,
  size,
}: {
  icon: React.ComponentType<SVGIconProps>
  position?: 'left' | 'right'
  size?: SVGIconProps['size']
}) {
  const {size: buttonSize, disabled} = useButtonContext()
  const textStyles = useSharedButtonTextStyles()
  const {iconSize, iconContainerSize} = React.useMemo(() => {
    /**
     * Pre-set icon sizes for different button sizes
     */
    const iconSizeShorthand =
      size ??
      (({
        large: 'sm',
        small: 'sm',
        tiny: 'xs',
      }[buttonSize || 'small'] || 'sm') as Exclude<
        SVGIconProps['size'],
        undefined
      >)

    /*
     * Copied here from icons/common.tsx so we can tweak if we need to, but
     * also so that we can calculate transforms.
     */
    const iconSize = {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 28,
      '2xl': 32,
    }[iconSizeShorthand]

    /*
     * Goal here is to match rendered text size so that different size icons
     * don't increase button size
     */
    const iconContainerSize = {
      large: 18,
      small: 16,
      tiny: 13,
    }[buttonSize || 'small']

    return {
      iconSize,
      iconContainerSize,
    }
  }, [buttonSize, size])

  return (
    <View
      style={[
        a.z_20,
        {
          width: iconContainerSize,
          height: iconContainerSize,
          opacity: disabled ? 0.7 : 1,
          marginLeft: position === 'left' ? -2 : 0,
          marginRight: position === 'right' ? -2 : 0,
        },
      ]}>
      <View
        style={[
          a.absolute,
          {
            width: iconSize,
            height: iconSize,
            top: '50%',
            left: '50%',
            transform: [
              {
                translateX: (iconSize / 2) * -1,
              },
              {
                translateY: (iconSize / 2) * -1,
              },
            ],
          },
        ]}>
        <Comp
          width={iconSize}
          style={[
            {
              color: textStyles.color,
              pointerEvents: 'none',
            },
          ]}
        />
      </View>
    </View>
  )
}
