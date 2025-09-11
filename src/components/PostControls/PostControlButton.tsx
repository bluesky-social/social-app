import {createContext, useContext, useMemo} from 'react'
import {type GestureResponderEvent, type Insets, type View} from 'react-native'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {Button, type ButtonProps} from '#/components/Button'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text, type TextProps} from '#/components/Typography'

export const DEFAULT_HITSLOP = {top: 5, bottom: 10, left: 10, right: 10}

const PostControlContext = createContext<{
  big?: boolean
  active?: boolean
  color?: {color: string}
}>({})
PostControlContext.displayName = 'PostControlContext'

// Base button style, which the the other ones extend
export function PostControlButton({
  ref,
  onPress,
  onLongPress,
  children,
  big,
  active,
  activeColor,
  ...props
}: Omit<ButtonProps, 'hitSlop'> & {
  ref?: React.Ref<View>
  active?: boolean
  big?: boolean
  color?: string
  activeColor?: string
  hitSlop?: Insets
}) {
  const t = useTheme()
  const playHaptic = useHaptics()

  const ctx = useMemo(
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
      {...props}
      hitSlop={{
        ...DEFAULT_HITSLOP,
        ...(props.hitSlop || {}),
      }}>
      {typeof children === 'function' ? (
        args => (
          <PostControlContext.Provider value={ctx}>
            {children(args)}
          </PostControlContext.Provider>
        )
      ) : (
        <PostControlContext.Provider value={ctx}>
          {children}
        </PostControlContext.Provider>
      )}
    </Button>
  )
}

export function PostControlButtonIcon({
  icon: Comp,
  style,
  ...rest
}: SVGIconProps & {
  icon: React.ComponentType<SVGIconProps>
}) {
  const {big, color} = useContext(PostControlContext)

  return (
    <Comp
      style={[color, a.pointer_events_none, style]}
      {...rest}
      width={big ? 22 : 18}
    />
  )
}

export function PostControlButtonText({style, ...props}: TextProps) {
  const {big, active, color} = useContext(PostControlContext)

  return (
    <Text
      style={[color, big ? a.text_md : a.text_sm, active && a.font_bold, style]}
      {...props}
    />
  )
}
