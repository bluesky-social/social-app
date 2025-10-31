import {StyleSheet} from 'react-native'
import type React from 'react'

import {isHighDPI} from '#/lib/browser'
import {atoms as a, platform, useTheme, type ViewStyleProp} from '#/alf'
import {Fill} from '#/components/Fill'

/**
 * Applies and thin border within a bounding box. Used to contrast media from
 * bg of the container.
 */
export function MediaInsetBorder({
  children,
  style,
  opaque,
}: {
  children?: React.ReactNode
  /**
   * Used where this border needs to match adjacent borders, such as in
   * external link previews
   */
  opaque?: boolean
} & ViewStyleProp) {
  const t = useTheme()
  const isLight = t.name === 'light'
  return (
    <Fill
      style={[
        a.rounded_md,
        {
          borderWidth: platform({
            native: StyleSheet.hairlineWidth,
            // while we generally use hairlineWidth (aka 1px),
            // we make an exception here for high DPI screens
            // as the 1px border is very noticeable -sfn
            web: isHighDPI ? 0.5 : StyleSheet.hairlineWidth,
          }),
        },
        opaque
          ? [t.atoms.border_contrast_low]
          : [
              isLight
                ? t.atoms.border_contrast_low
                : t.atoms.border_contrast_high,
              {opacity: 0.6},
            ],
        a.pointer_events_none,
        style,
      ]}>
      {children}
    </Fill>
  )
}
