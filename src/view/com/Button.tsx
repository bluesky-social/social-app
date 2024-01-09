import React from 'react'
import {
  Pressable,
  Text,
  PressableProps,
  TextProps,
  ViewStyle,
} from 'react-native'

import {useTheme, atoms, tokens, web, native} from '#/alf'

export type ButtonType = 'primary' | 'secondary' | 'negative'
export type ButtonSize = 'small' | 'large'
export type VariantProps = {
  /**
   * The presentation styles of the button
   */
  type?: ButtonType
  /**
   * The size of the button
   */
  size?: ButtonSize
}

export type ButtonProps = Omit<PressableProps, 'children'> &
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
  }
export type ButtonTextProps = TextProps & VariantProps & {disabled?: boolean}

export function Button({
  children,
  style,
  type,
  size,
  disabled = false,
  ...rest
}: ButtonProps) {
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

  const {baseStyles, hoverStyles} = React.useMemo(() => {
    const baseStyles: ViewStyle[] = []
    const hoverStyles: ViewStyle[] = []

    switch (type) {
      case 'primary': {
        if (disabled) {
          baseStyles.push({
            backgroundColor: tokens.color.blue_300,
          })
        } else {
          baseStyles.push({
            backgroundColor: tokens.color.blue_500,
          })
        }
        break
      }
      case 'secondary': {
        if (disabled) {
          baseStyles.push({
            backgroundColor: tokens.color.gray_100,
          })
        } else {
          baseStyles.push({
            backgroundColor: tokens.color.gray_200,
          })
        }
        break
      }
      case 'negative': {
        if (disabled) {
          baseStyles.push({
            backgroundColor: tokens.color.red_400,
          })
        } else {
          baseStyles.push({
            backgroundColor: tokens.color.red_500,
          })
        }
        break
      }
      default:
    }

    switch (size) {
      case 'large': {
        baseStyles.push(
          atoms.py_md,
          atoms.px_xl,
          atoms.rounded_md,
          atoms.gap_sm,
        )
        break
      }
      case 'small': {
        baseStyles.push(
          atoms.py_sm,
          atoms.px_md,
          atoms.rounded_sm,
          atoms.gap_xs,
        )
        break
      }
      default:
    }

    return {
      baseStyles,
      hoverStyles,
    }
  }, [type, size, disabled])

  const childProps = React.useMemo(
    () => ({
      state,
      props: {
        type,
        size,
        disabled: disabled || false,
      },
    }),
    [state, type, size, disabled],
  )

  return (
    <Pressable
      role="button"
      {...rest}
      disabled={disabled || false}
      accessibilityState={{
        disabled: disabled || false,
      }}
      style={[
        atoms.flex_row,
        atoms.align_center,
        ...baseStyles,
        ...(state.hovered ? hoverStyles : []),
        typeof style === 'function' ? style(state) : style,
      ]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      onFocus={onFocus}
      onBlur={onBlur}>
      {typeof children === 'string' ? (
        <ButtonText type={type} size={size} disabled={disabled || false}>
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
  type,
  size,
  disabled,
  ...rest
}: ButtonTextProps) {
  const t = useTheme()

  const textStyles = React.useMemo(() => {
    const baseStyles = []

    switch (type) {
      case 'primary': {
        baseStyles.push({color: tokens.color.white})
        break
      }
      case 'secondary': {
        if (disabled) {
          baseStyles.push({
            color: tokens.color.gray_500,
          })
        } else {
          baseStyles.push({
            color: tokens.color.gray_700,
          })
        }
        break
      }
      case 'negative': {
        baseStyles.push({
          color: tokens.color.white,
        })
        break
      }
      default:
        baseStyles.push(t.atoms.text)
    }

    switch (size) {
      case 'small': {
        baseStyles.push(
          atoms.text_sm,
          web({paddingBottom: 1}),
          native({marginTop: 2}),
        )
        break
      }
      case 'large': {
        baseStyles.push(
          atoms.text_md,
          web({paddingBottom: 1}),
          native({marginTop: 2}),
        )
        break
      }
      default:
    }

    return baseStyles
  }, [t, type, size, disabled])

  return (
    <Text
      {...rest}
      style={[
        atoms.flex_1,
        atoms.font_semibold,
        atoms.text_center,
        ...textStyles,
        style,
      ]}>
      {children}
    </Text>
  )
}
