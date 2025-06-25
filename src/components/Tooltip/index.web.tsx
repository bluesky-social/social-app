import {Children, createContext, useContext, useMemo} from 'react'
import {View} from 'react-native'
import {Popover} from 'radix-ui'

import {atoms as a, flatten, select, useTheme} from '#/alf'
import {transparentifyColor} from '#/alf/util/colorGeneration'
import {
  ARROW_SIZE,
  BUBBLE_MAX_WIDTH,
  MIN_EDGE_SPACE,
} from '#/components/Tooltip/const'
import {Text} from '#/components/Typography'

type TooltipContextType = {
  position: 'top' | 'bottom'
}

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
})

export function Outer({
  children,
  position = 'bottom',
  visible,
  onVisibleChange,
}: {
  children: React.ReactNode
  position?: 'top' | 'bottom'
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  const ctx = useMemo(() => ({position}), [position])
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
  const {position} = useContext(TooltipContext)
  return (
    <Popover.Portal>
      <Popover.Content
        className="radix-popover-content"
        aria-label={label}
        side={position}
        sideOffset={4}
        collisionPadding={MIN_EDGE_SPACE}
        style={flatten([
          a.rounded_sm,
          select(t.name, {
            light: t.atoms.bg,
            dark: t.atoms.bg_contrast_100,
            dim: t.atoms.bg_contrast_100,
          }),
          {
            minWidth: 'max-content',
            boxShadow: select(t.name, {
              light: `0 0 24px ${transparentifyColor(t.palette.black, 0.2)}`,
              dark: `0 0 24px ${transparentifyColor(t.palette.black, 0.2)}`,
              dim: `0 0 24px ${transparentifyColor(t.palette.black, 0.2)}`,
            }),
          },
        ])}>
        <Popover.Arrow
          width={ARROW_SIZE}
          height={ARROW_SIZE / 2}
          fill={select(t.name, {
            light: t.atoms.bg.backgroundColor,
            dark: t.atoms.bg_contrast_100.backgroundColor,
            dim: t.atoms.bg_contrast_100.backgroundColor,
          })}
        />
        <View style={[a.px_md, a.py_sm, {maxWidth: BUBBLE_MAX_WIDTH}]}>
          {children}
        </View>
      </Popover.Content>
    </Popover.Portal>
  )
}

export function TextBubble({children}: {children: React.ReactNode}) {
  const c = Children.toArray(children)
  return (
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}>
        {c.map((child, i) => (
          <Text key={i} style={[a.text_sm, a.leading_snug]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  )
}
