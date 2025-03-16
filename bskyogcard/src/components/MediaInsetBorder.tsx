import React from 'react'

import {atoms as a, StyleProp,theme as t} from '../theme/index.js'
import {Box} from './Box.js'

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
} & StyleProp) {
  const isLight = t.name === 'light'
  return (
    <Box
      cx={[
        a.absolute,
        a.inset_0,
        a.rounded_md,
        a.border,
        opaque
          ? [t.atoms.border_contrast_low]
          : [
              isLight
                ? t.atoms.border_contrast_low
                : t.atoms.border_contrast_high,
              {opacity: 0.6},
            ],
        {
          pointerEvents: 'none',
        },
        style,
      ]}>
      {children}
    </Box>
  )
}
