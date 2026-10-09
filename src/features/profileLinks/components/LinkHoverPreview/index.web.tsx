import {View} from 'react-native'
import {utils} from '@bsky.app/alf'
import * as Tooltip from '@radix-ui/react-tooltip'

import {atoms as a, flattenToCSS, useTheme} from '#/alf'
import {
  ARROW_SIZE,
  getTooltipStyle,
  MIN_EDGE_SPACE,
} from '#/components/Tooltip/const'
import {LinkDestination} from '../LinkDestination'

/**
 * Shows a link's full destination above its pill on hover or keyboard focus,
 * so a title can't hide where it goes.
 */
export function LinkHoverPreview({
  url,
  children,
}: {
  url: string
  children: React.ReactNode
}) {
  const t = useTheme()
  const style = getTooltipStyle(t, 'default')
  return (
    <Tooltip.Provider delayDuration={200}>
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
              a.px_md,
              a.py_sm,
              {
                backgroundColor: style.surface,
                borderColor: style.border.color,
                borderWidth: style.border.width,
                borderStyle: 'solid',
                maxWidth: 360,
                boxShadow: `0 0 24px ${utils.alpha(t.palette.black, 0.2)}`,
              },
            ])}>
            <LinkDestination url={url} />
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
