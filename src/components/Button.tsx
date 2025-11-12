import React from 'react'
import {
  type AccessibilityProps,
  type GestureResponderEvent,
  type MouseEvent,
  type NativeSyntheticEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  type TargetedEvent,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import {atoms as a, flatten, select, useTheme} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'

/**
 * The `Button` component, and some extensions of it like `Link` are intended
 * to be generic and therefore apply no styles by default. These `VariantProps`
 * are what control the `Button`'s presentation, and are intended only use cases where the buttons appear as, well, buttons.
 *
 * If `Button` or an extension of it are used for other compound components, use this property to avoid misuse of these variant props further down the line.
 *
 * @example
 * type MyComponentProps = Omit<ButtonProps, UninheritableButtonProps> & {...}
 */
export type UninheritableButtonProps = 'variant' | 'color' | 'size' | 'shape'

export type ButtonVariant = 'solid' | 'outline' | 'ghost'
export type ButtonColor =
  | 'primary'
  | 'secondary'
  | 'secondary_inverted'
  | 'negative'
  | 'primary_subtle'
  | 'negative_subtle'
export type ButtonSize = 'tiny' | 'small' | 'large'
export type ButtonShape = 'round' | 'square' | 'rectangular' | 'default'
export type VariantProps = {
  /**
   * The style variation of the button
   * @deprecated Use `color` instead.
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
   *
   * - `default`: Pill shaped. Most buttons should use this shape.
   * - `round`: Circular. For icon-only buttons.
   * - `square`: Square. For icon-only buttons.
   * - `rectangular`: Rectangular. Matches previous style, use when adjacent to form fields.
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
  | React.ReactElement<any>
  | Iterable<React.ReactElement<any> | null | undefined | boolean>

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
  | 'onFocus'
  | 'onBlur'
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
Context.displayName = 'ButtonContext'

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
      onPressIn: onPressInOuter,
      onPressOut: onPressOutOuter,
      onHoverIn: onHoverInOuter,
      onHoverOut: onHoverOutOuter,
      onFocus: onFocusOuter,
      onBlur: onBlurOuter,
      ...rest
    },
    ref,
  ) => {
    /**
     * The `variant` prop is deprecated in favor of simply specifying `color`.
     * If a `color` is set, then we want to use the existing codepaths for
     * "solid" buttons. This is to maintain backwards compatibility.
     */
    if (!variant && color) {
      variant = 'solid'
    }

    const t = useTheme()
    const [state, setState] = React.useState({
      pressed: false,
      hovered: false,
      focused: false,
    })

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
    const onFocus = React.useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setState(s => ({
          ...s,
          focused: true,
        }))
        onFocusOuter?.(e)
      },
      [setState, onFocusOuter],
    )
    const onBlur = React.useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setState(s => ({
          ...s,
          focused: false,
        }))
        onBlurOuter?.(e)
      },
      [setState, onBlurOuter],
    )

    const {baseStyles, hoverStyles} = React.useMemo(() => {
      const baseStyles: ViewStyle[] = []
      const hoverStyles: ViewStyle[] = []

      /*
       * This is the happy path for new button styles, following the
       * deprecation of `variant` prop. This redundant `variant` check is here
       * just to make this handling easier to understand.
       */
      if (variant === 'solid') {
        if (color === 'primary') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.primary_500,
            })
            hoverStyles.push({
              backgroundColor: t.palette.primary_600,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.primary_200,
            })
          }
        } else if (color === 'secondary') {
          if (!disabled) {
            baseStyles.push(t.atoms.bg_contrast_50)
            hoverStyles.push(t.atoms.bg_contrast_100)
          } else {
            baseStyles.push(t.atoms.bg_contrast_50)
          }
        } else if (color === 'secondary_inverted') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.contrast_900,
            })
            hoverStyles.push({
              backgroundColor: t.palette.contrast_975,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.contrast_600,
            })
          }
        } else if (color === 'negative') {
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
        } else if (color === 'primary_subtle') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.primary_50,
            })
            hoverStyles.push({
              backgroundColor: t.palette.primary_100,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.primary_50,
            })
          }
        } else if (color === 'negative_subtle') {
          if (!disabled) {
            baseStyles.push({
              backgroundColor: t.palette.negative_50,
            })
            hoverStyles.push({
              backgroundColor: t.palette.negative_100,
            })
          } else {
            baseStyles.push({
              backgroundColor: t.palette.negative_50,
            })
          }
        }
      } else {
        /*
         * BEGIN DEPRECATED STYLES
         */
        if (color === 'primary') {
          if (variant === 'outline') {
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
          if (variant === 'outline') {
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
                backgroundColor: t.palette.contrast_50,
              })
            }
          }
        } else if (color === 'secondary_inverted') {
          if (variant === 'outline') {
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
                backgroundColor: t.palette.contrast_50,
              })
            }
          }
        } else if (color === 'negative') {
          if (variant === 'outline') {
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
        } else if (color === 'negative_subtle') {
          if (variant === 'outline') {
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
        /*
         * END DEPRECATED STYLES
         */
      }

      if (shape === 'default') {
        if (size === 'large') {
          baseStyles.push(a.rounded_full, {
            paddingVertical: 12,
            paddingHorizontal: 25,
            gap: 3,
          })
        } else if (size === 'small') {
          baseStyles.push(a.rounded_full, {
            paddingVertical: 8,
            paddingHorizontal: 13,
            gap: 3,
          })
        } else if (size === 'tiny') {
          baseStyles.push(a.rounded_full, {
            paddingVertical: 5,
            paddingHorizontal: 9,
            gap: 2,
          })
        }
      } else if (shape === 'rectangular') {
        if (size === 'large') {
          baseStyles.push({
            paddingVertical: 12,
            paddingHorizontal: 25,
            borderRadius: 10,
            gap: 3,
          })
        } else if (size === 'small') {
          baseStyles.push({
            paddingVertical: 8,
            paddingHorizontal: 13,
            borderRadius: 8,
            gap: 3,
          })
        } else if (size === 'tiny') {
          baseStyles.push({
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 6,
            gap: 2,
          })
        }
      } else if (shape === 'round' || shape === 'square') {
        /*
         * These sizes match the actual rendered size on screen, based on
         * Chrome's web inspector
         */
        if (size === 'large') {
          if (shape === 'round') {
            baseStyles.push({height: 44, width: 44})
          } else {
            baseStyles.push({height: 44, width: 44})
          }
        } else if (size === 'small') {
          if (shape === 'round') {
            baseStyles.push({height: 33, width: 33})
          } else {
            baseStyles.push({height: 33, width: 33})
          }
        } else if (size === 'tiny') {
          if (shape === 'round') {
            baseStyles.push({height: 25, width: 25})
          } else {
            baseStyles.push({height: 25, width: 25})
          }
        }

        if (shape === 'round') {
          baseStyles.push(a.rounded_full)
        } else if (shape === 'square') {
          if (size === 'tiny') {
            baseStyles.push({
              borderRadius: 6,
            })
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

    return (
      <PressableComponent
        role="button"
        accessibilityHint={undefined} // optional
        {...rest}
        // @ts-ignore - this will always be a pressable
        ref={ref}
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
          a.justify_center,
          a.curve_continuous,
          baseStyles,
          style,
          ...(state.hovered || state.pressed
            ? [hoverStyles, hoverStyleProp]
            : []),
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        onFocus={onFocus}
        onBlur={onBlur}>
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

    /*
     * This is the happy path for new button styles, following the
     * deprecation of `variant` prop. This redundant `variant` check is here
     * just to make this handling easier to understand.
     */
    if (variant === 'solid') {
      if (color === 'primary') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({
            color: select(t.name, {
              light: t.palette.white,
              dim: t.atoms.text_inverted.color,
              dark: t.atoms.text_inverted.color,
            }),
          })
        }
      } else if (color === 'secondary') {
        if (!disabled) {
          baseStyles.push(t.atoms.text_contrast_medium)
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (color === 'secondary_inverted') {
        if (!disabled) {
          baseStyles.push(t.atoms.text_inverted)
        } else {
          baseStyles.push({
            color: t.palette.contrast_300,
          })
        }
      } else if (color === 'negative') {
        if (!disabled) {
          baseStyles.push({color: t.palette.white})
        } else {
          baseStyles.push({color: t.palette.negative_300})
        }
      } else if (color === 'primary_subtle') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.primary_600,
          })
        } else {
          baseStyles.push({
            color: t.palette.primary_200,
          })
        }
      } else if (color === 'negative_subtle') {
        if (!disabled) {
          baseStyles.push({
            color: t.palette.negative_600,
          })
        } else {
          baseStyles.push({
            color: t.palette.negative_200,
          })
        }
      }
    } else {
      /*
       * BEGIN DEPRECATED STYLES
       */
      if (color === 'primary') {
        if (variant === 'outline') {
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
        if (variant === 'outline') {
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
        if (variant === 'outline') {
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
        if (variant === 'outline') {
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
      } else if (color === 'negative_subtle') {
        if (variant === 'outline') {
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
      }
      /*
       * END DEPRECATED STYLES
       */
    }

    if (size === 'large') {
      baseStyles.push(a.text_md, a.leading_snug, a.font_medium)
    } else if (size === 'small') {
      baseStyles.push(a.text_sm, a.leading_snug, a.font_medium)
    } else if (size === 'tiny') {
      baseStyles.push(a.text_xs, a.leading_snug, a.font_semi_bold)
    }

    return flatten(baseStyles)
  }, [t, variant, color, size, disabled])
}

export function ButtonText({children, style, ...rest}: ButtonTextProps) {
  const textStyles = useSharedButtonTextStyles()

  return (
    <Text {...rest} style={[a.text_center, textStyles, style]}>
      {children}
    </Text>
  )
}

export function ButtonIcon({
  icon: Comp,
  size,
}: {
  icon: React.ComponentType<SVGIconProps>
  /**
   * @deprecated no longer needed
   */
  position?: 'left' | 'right'
  size?: SVGIconProps['size']
}) {
  const {size: buttonSize} = useButtonContext()
  const textStyles = useSharedButtonTextStyles()
  const {iconSize, iconContainerSize} = React.useMemo(() => {
    /**
     * Pre-set icon sizes for different button sizes
     */
    const iconSizeShorthand =
      size ??
      (({
        large: 'md',
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
      md: 18,
      lg: 24,
      xl: 28,
      '2xl': 32,
    }[iconSizeShorthand]

    /*
     * Goal here is to match rendered text size so that different size icons
     * don't increase button size
     */
    const iconContainerSize = {
      large: 20,
      small: 17,
      tiny: 15,
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

export type StackedButtonProps = Omit<
  ButtonProps,
  keyof VariantProps | 'children'
> &
  Pick<VariantProps, 'color'> & {
    children: React.ReactNode
    icon: React.ComponentType<SVGIconProps>
  }

export function StackedButton({children, ...props}: StackedButtonProps) {
  return (
    <Button
      {...props}
      size="tiny"
      style={[
        a.flex_col,
        {
          height: 72,
          paddingHorizontal: 16,
          borderRadius: 20,
          gap: 4,
        },
        props.style,
      ]}>
      <StackedButtonInnerText icon={props.icon}>
        {children}
      </StackedButtonInnerText>
    </Button>
  )
}

function StackedButtonInnerText({
  children,
  icon: Icon,
}: Pick<StackedButtonProps, 'icon' | 'children'>) {
  const textStyles = useSharedButtonTextStyles()
  return (
    <>
      <Icon width={24} fill={textStyles.color} />
      <ButtonText>{children}</ButtonText>
    </>
  )
}
