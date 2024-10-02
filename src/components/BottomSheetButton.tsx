import React from 'react'
import {AccessibilityProps, ViewStyle} from 'react-native'
import {PressableEvent} from 'react-native-gesture-handler/lib/typescript/components/Pressable/PressableProps'
import {
  BlueskyBottomSheetPressable,
  BlueskyBottomSheetPressableProps,
} from '@haileyok/bluesky-bottom-sheet'

import {atoms as a} from '#/alf'
import {
  ButtonContext,
  useSharedButtonStyles,
  VariantProps,
} from '#/components/Button'

export function BottomSheetButton({
  children,
  label,
  color,
  variant,
  shape = 'default',
  size,
  disabled,
  style,
  ...rest
}: BlueskyBottomSheetPressableProps &
  AccessibilityProps &
  VariantProps & {
    /**
     * For a11y, try to make this descriptive and clear
     */
    label: string
  }) {
  const [state, setState] = React.useState({
    pressed: false,
    hovered: false,
    focused: false,
  })

  const onPressInOuter = rest.onPressIn
  const onPressIn = React.useCallback(
    (e: PressableEvent) => {
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
    (e: PressableEvent) => {
      setState(s => ({
        ...s,
        pressed: false,
      }))
      onPressOutOuter?.(e)
    },
    [setState, onPressOutOuter],
  )

  const {baseStyles, hoverStyles} = useSharedButtonStyles({
    /**
     * For a11y, try to make this descriptive and clear
     */
    color,
    variant,
    shape,
    size,
    disabled,
  })

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
    <BlueskyBottomSheetPressable
      style={[
        a.flex_row,
        a.align_center,
        a.justify_center,
        baseStyles,
        style as ViewStyle,
        ...(state.hovered || state.pressed ? [hoverStyles] : []),
      ]}
      aria-label={label}
      aria-pressed={state.pressed}
      accessibilityLabel={label}
      accessibilityHint={undefined}
      accessibilityState={{
        disabled: disabled || false,
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...rest}>
      <ButtonContext.Provider value={context}>
        {typeof children === 'function' ? children(context) : children}
      </ButtonContext.Provider>
    </BlueskyBottomSheetPressable>
  )
}
