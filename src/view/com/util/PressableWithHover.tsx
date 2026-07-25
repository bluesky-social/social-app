import {forwardRef, type PropsWithChildren} from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native'

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
