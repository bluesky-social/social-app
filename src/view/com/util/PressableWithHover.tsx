import {forwardRef, PropsWithChildren} from 'react'
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'
import {View} from 'react-native'

import {addStyle} from '#/lib/styles'
import {useInteractionState} from '#/components/hooks/useInteractionState'

interface PressableWithHover extends PressableProps {
  hoverStyle: StyleProp<ViewStyle>
}

export const PressableWithHover = forwardRef<
  View,
  PropsWithChildren<PressableWithHover>
>(function PressableWithHoverImpl(
  {children, style, hoverStyle, ...props},
  ref,
) {
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()

  return (
    <Pressable
      {...props}
      style={
        typeof style !== 'function' && hovered
          ? addStyle(style, hoverStyle)
          : style
      }
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      ref={ref}>
      {children}
    </Pressable>
  )
})
