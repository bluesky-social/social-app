import React from 'react'
import {Pressable, Text, PressableProps, TextProps} from 'react-native'
import * as tokens from '#/alf/tokens'
import {useTheme, atoms} from '#/alf'

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
  const t = useTheme()
  const {baseStyles, hoverStyles} = React.useMemo(() => {
    const baseStyles = []
    const hoverStyles = []

    switch (type) {
      case 'primary':
        baseStyles.push(t.atoms.backgroundColor.primary)
        break
      case 'secondary':
        baseStyles.push(t.atoms.backgroundColor.l2)
        hoverStyles.push(t.atoms.backgroundColor.l1)
        break
      default:
    }

    switch (size) {
      case 'large':
        baseStyles.push(
          atoms.padding.py.m,
          atoms.padding.px.xl,
          atoms.radius.m,
          atoms.flex.gap.s,
        )
        break
      case 'small':
        baseStyles.push(
          atoms.padding.py.s,
          atoms.padding.px.m,
          atoms.radius.s,
          atoms.flex.gap.xs,
        )
        break
      default:
    }

    return {
      baseStyles,
      hoverStyles,
    }
  }, [type, size, t])

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
        atoms.flex.row,
        atoms.flex.alignCenter,
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
  const t = useTheme()
  const textStyles = React.useMemo(() => {
    const base = []

    switch (type) {
      case 'primary':
        base.push({color: tokens.color.white})
        break
      case 'secondary':
        base.push(t.atoms.color.l5)
        break
      default:
    }

    switch (size) {
      case 'small':
        base.push(atoms.font.s, {paddingBottom: 1})
        break
      case 'large':
        base.push(atoms.font.m, {paddingBottom: 1})
        break
      default:
    }

    return base
  }, [type, size, t])

  return (
    <Text
      {...rest}
      style={[
        atoms.flex.one,
        atoms.font.semi,
        atoms.font.center,
        ...textStyles,
        style,
      ]}>
      {children}
    </Text>
  )
}
