import {Pressable, type StyleProp, type ViewStyle} from 'react-native'

import {addStyle} from '#/lib/styles'
import {useInteractionState} from '#/components/hooks/useInteractionState'

interface PressableWithHoverProps extends React.ComponentPropsWithRef<Pressable> {
  hoverStyle: StyleProp<ViewStyle>
}

export function PressableWithHover({
  ref,
  children,
  style,
  hoverStyle,
  ...props
}: PressableWithHoverProps) {
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
}
