import React from 'react'
import {Pressable, Text, PressableProps, TextProps} from 'react-native'
import * as tokens from '#/alf/tokens'
import {atoms} from '#/alf'

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'positive'
  | 'negative'
export type ButtonSize = 'small' | 'large'

export type VariantProps = {
  type?: ButtonType
  size?: ButtonSize
}
type ButtonState = {
  pressed: boolean
  hovered: boolean
  focused: boolean
}
export type ButtonProps = Omit<PressableProps, 'children'> &
  VariantProps & {
    children:
      | ((props: {
          state: ButtonState
          type?: ButtonType
          size?: ButtonSize
        }) => React.ReactNode)
      | React.ReactNode
      | string
  }
export type ButtonTextProps = TextProps & VariantProps

export function Button({children, style, type, size, ...rest}: ButtonProps) {
  const {baseStyles, hoverStyles} = React.useMemo(() => {
    const baseStyles = []
    const hoverStyles = []

    switch (type) {
      case 'primary':
        baseStyles.push({
          backgroundColor: tokens.color.blue_500,
        })
        break
      case 'secondary':
        baseStyles.push({
          backgroundColor: tokens.color.gray_200,
        })
        hoverStyles.push({
          backgroundColor: tokens.color.gray_100,
        })
        break
      default:
    }

    switch (size) {
      case 'large':
        baseStyles.push(
          atoms.py_md,
          atoms.px_xl,
          atoms.rounded_md,
          atoms.gap_sm,
        )
        break
      case 'small':
        baseStyles.push(
          atoms.py_sm,
          atoms.px_md,
          atoms.rounded_sm,
          atoms.gap_xs,
        )
        break
      default:
    }

    return {
      baseStyles,
      hoverStyles,
    }
  }, [type, size])

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

  return (
    <Pressable
      {...rest}
      style={state => [
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
        <ButtonText type={type} size={size}>
          {children}
        </ButtonText>
      ) : typeof children === 'function' ? (
        children({state, type, size})
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
  ...rest
}: ButtonTextProps) {
  const textStyles = React.useMemo(() => {
    const base = []

    switch (type) {
      case 'primary':
        base.push({color: tokens.color.white})
        break
      case 'secondary':
        base.push({
          color: tokens.color.gray_700,
        })
        break
      default:
    }

    switch (size) {
      case 'small':
        base.push(atoms.text_sm, {paddingBottom: 1})
        break
      case 'large':
        base.push(atoms.text_md, {paddingBottom: 1})
        break
      default:
    }

    return base
  }, [type, size])

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
