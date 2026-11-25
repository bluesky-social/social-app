import {View} from 'react-native'
import {utils} from '@bsky.app/alf'
import * as Tooltip from '@radix-ui/react-tooltip'

import {atoms as a, flattenToCSS, useTheme} from '#/alf'
import {
  ARROW_SIZE,
  getTooltipStyle,
  MIN_EDGE_SPACE,
} from '#/components/Tooltip/const'
import {Text} from '#/components/Typography'

/**
 * A short label above its children on hover or keyboard focus, e.g. naming
 * what an icon-only button does. Touch doesn't open it.
 */
export function HoverTooltip({
  label,
  color = 'default',
  children,
}: {
  label: string
  /** `primary` matches a primary-tinted control's hover, e.g. a like button. */
  color?: 'default' | 'primary'
  children: React.ReactNode
}) {
  const t = useTheme()
  const style =
    color === 'primary'
      ? // The like button's hover colors, not the shared `primary` tooltip's.
        {surface: t.palette.primary_50, text: t.palette.primary_700}
      : getTooltipStyle(t, 'default')
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <View>{children}</View>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={4}
            collisionPadding={MIN_EDGE_SPACE}
            style={flattenToCSS([
              a.rounded_sm,
              a.px_sm,
              {
                paddingTop: 2,
                paddingBottom: 4,
                backgroundColor: style.surface,
                boxShadow: `0 0 24px ${utils.alpha(t.palette.black, 0.2)}`,
              },
            ])}>
            <Text
              style={[
                a.text_xs,
                a.font_medium,
                a.leading_tight,
                {color: style.text},
              ]}>
              {label}
            </Text>
            <Tooltip.Arrow
              width={ARROW_SIZE}
              height={ARROW_SIZE / 2}
              fill={style.surface}
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
