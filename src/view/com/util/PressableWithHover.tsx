import {addStyle} from 'lib/styles'
import React, {
  forwardRef,
  PropsWithChildren,
  Ref,
  useCallback,
  useState,
} from 'react'
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'

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
