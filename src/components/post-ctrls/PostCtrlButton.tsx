import React, {useContext, useMemo} from 'react'
import {GestureResponderEvent, View} from 'react-native'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonProps} from '#/components/Button'
import {Props as SVGIconProps} from '#/components/icons/common'
import {Text, TextProps} from '#/components/Typography'

const PostCtrlContext = React.createContext<{
  big?: boolean
  active?: boolean
  color?: {color: string}
}>({})

// Base button style, which the the other ones extend
export const PostCtrlButton = React.forwardRef<
  View,
  ButtonProps & {
    active?: boolean
    big?: boolean
    color?: string
    activeColor?: string
  }
>(
  (
    {onPress, onLongPress, children, big, active, activeColor, ...props},
    ref,
  ) => {
    const t = useTheme()
    const playHaptic = useHaptics()

    const ctx = React.useMemo(
      () => ({
        big,
        active,
        color: {
          color: activeColor && active ? activeColor : t.palette.contrast_500,
        },
      }),
      [big, active, activeColor, t.palette.contrast_500],
    )

    const style = useMemo(
      () => [
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.bg_transparent,
        {padding: 5},
      ],
      [],
    )

    const handlePress = useMemo(() => {
      if (!onPress) return
      return (evt: GestureResponderEvent) => {
        playHaptic('Light')
        onPress(evt)
      }
    }, [onPress, playHaptic])

    const handleLongPress = useMemo(() => {
      if (!onLongPress) return
      return (evt: GestureResponderEvent) => {
        playHaptic('Heavy')
        onLongPress(evt)
      }
    }, [onLongPress, playHaptic])

    return (
      <Button
        ref={ref}
        onPress={handlePress}
        onLongPress={handleLongPress}
        style={style}
        hoverStyle={t.atoms.bg_contrast_25}
        shape="round"
        variant="ghost"
        color="secondary"
        hitSlop={POST_CTRL_HITSLOP}
        {...props}>
        {typeof children === 'function' ? (
          args => (
            <PostCtrlContext.Provider value={ctx}>
              {children(args)}
            </PostCtrlContext.Provider>
          )
        ) : (
          <PostCtrlContext.Provider value={ctx}>
            {children}
          </PostCtrlContext.Provider>
        )}
      </Button>
    )
  },
)
PostCtrlButton.displayName = 'PostCtrlButton'

export function PostCtrlButtonIcon({
  icon: Comp,
}: {
  icon: React.ComponentType<SVGIconProps>
}) {
  const {big, color} = useContext(PostCtrlContext)

  return <Comp style={[color, a.pointer_events_none]} width={big ? 22 : 18} />
}

export function PostCtrlButtonText({style, ...props}: TextProps) {
  const {big, active, color} = useContext(PostCtrlContext)

  return (
    <Text
      style={[
        color,
        big ? a.text_md : {fontSize: 15},
        active && a.font_bold,
        style,
      ]}
      {...props}
    />
  )
}
