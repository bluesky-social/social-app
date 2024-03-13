import React, {
  useState,
  useCallback,
  PropsWithChildren,
  forwardRef,
  Ref,
} from 'react'
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'
import {addStyle} from 'lib/styles'

interface PressableWithHover extends PressableProps {
  hoverStyle: StyleProp<ViewStyle>
}

export const PressableWithHover = forwardRef(function PressableWithHoverImpl(
  {
    children,
    style,
    hoverStyle,
    ...props
  }: PropsWithChildren<PressableWithHover>,
  ref: Ref<any>,
) {
  const [isHovering, setIsHovering] = useState(false)

  const onHoverIn = useCallback(() => setIsHovering(true), [setIsHovering])
  const onHoverOut = useCallback(() => setIsHovering(false), [setIsHovering])
  style =
    typeof style !== 'function' && isHovering
      ? addStyle(style, hoverStyle)
      : style

  return (
    <Pressable
      {...props}
      style={style}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      ref={ref}>
      {children}
    </Pressable>
  )
})
