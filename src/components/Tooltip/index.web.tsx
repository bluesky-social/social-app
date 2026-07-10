import {Children, createContext, useContext, useMemo} from 'react'
import {View} from 'react-native'
import {utils} from '@bsky.app/alf'
import {Popover} from 'radix-ui'

import {atoms as a, flatten, useTheme} from '#/alf'
import {
  ARROW_SIZE,
  BUBBLE_MAX_WIDTH,
  getTooltipStyle,
  MIN_EDGE_SPACE,
  type TooltipColor,
} from '#/components/Tooltip/const'
import {Text} from '#/components/Typography'

// Portal Provider on native, but we actually don't need to do anything here
export function Provider({children}: {children: React.ReactNode}) {
  return <>{children}</>
}
Provider.displayName = 'TooltipProvider'

type TooltipContextType = {
  position: 'top' | 'bottom'
  color: TooltipColor
  onVisibleChange: (open: boolean) => void
}

const TooltipContext = createContext<
  Pick<TooltipContextType, 'position' | 'color'>
>({
  position: 'bottom',
  color: 'default',
})
TooltipContext.displayName = 'TooltipContext'

export function Outer({
  children,
  position = 'bottom',
  color = 'default',
  visible,
  onVisibleChange,
}: {
  children: React.ReactNode
  position?: 'top' | 'bottom'
  color?: TooltipColor
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  const ctx = useMemo(() => ({position, color}), [position, color])
  return (
    <Popover.Root open={visible} onOpenChange={onVisibleChange}>
      <TooltipContext.Provider value={ctx}>{children}</TooltipContext.Provider>
    </Popover.Root>
  )
}

export function Target({children}: {children: React.ReactNode}) {
  return (
    <Popover.Trigger asChild>
      <View collapsable={false}>{children}</View>
    </Popover.Trigger>
  )
}

export function Content({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const t = useTheme()
  const {position, color} = useContext(TooltipContext)
  const style = getTooltipStyle(t, color)
  return (
    <Popover.Portal>
      <Popover.Content
        className="radix-popover-content"
        aria-label={label}
        side={position}
        sideOffset={4}
        collisionPadding={MIN_EDGE_SPACE}
        onInteractOutside={evt => {
          if (evt.type === 'dismissableLayer.focusOutside') {
            evt.preventDefault()
          }
        }}
        style={flatten([
          a.rounded_sm,
          {
            backgroundColor: style.surface,
            borderColor: style.border.color,
            borderWidth: style.border.width,
            borderStyle: 'solid',
            minWidth: 'max-content',
            boxShadow: `0 0 24px ${utils.alpha(t.palette.black, 0.2)}`,
          },
        ])}>
        <Popover.Arrow
          width={ARROW_SIZE}
          height={ARROW_SIZE / 2}
          fill={style.surface}
        />
        <View style={[a.px_md, a.py_sm, {maxWidth: BUBBLE_MAX_WIDTH}]}>
          {children}
        </View>
      </Popover.Content>
    </Popover.Portal>
  )
}

export function BubbleText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {color} = useContext(TooltipContext)
  const style = getTooltipStyle(t, color)
  const c = Children.toArray(children)
  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}>
        {c.map((child, i) => (
          <Text
            key={i}
            style={[a.text_sm, a.leading_snug, {color: style.text}]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  )
}
