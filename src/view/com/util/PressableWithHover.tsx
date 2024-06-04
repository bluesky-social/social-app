import React from 'react'
import {Pressable, PressableProps, StyleProp, ViewStyle} from 'react-native'
import {addStyle} from 'lib/styles'

interface PressableWithHover extends PressableProps {
  hoverStyle: StyleProp<ViewStyle>
}

export const PressableWithHover = React.forwardRef(function PressableWithHoverImpl(
  {
    children,
    style,
    hoverStyle,
    ...props
  }: React.PropsWithChildren<PressableWithHover>,
  ref: React.Ref<any>,
) {
  const [isHovering, setIsHovering] = React.useState(false)

  const onHoverIn = React.useCallback(() => setIsHovering(true), [setIsHovering])
  const onHoverOut = React.useCallback(() => setIsHovering(false), [setIsHovering])
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
