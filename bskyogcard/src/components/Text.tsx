import React from 'react'

import {atoms as a, style as s, theme as t} from '../theme/index.js'

const SCALE_MULTIPLIER = 1 - 0.0625

export function Text({
  children,
  cx,
}: {
  children?: React.ReactNode
  cx?: Record<string, any>[]
}) {
  const styles = s([
    a.flex,
    a.flex_wrap,
    {
      columnGap: '1px',
    },
    a.font_normal,
    a.leading_tight,
    a.tracking_wide,
    t.atoms.text,
    ...(cx ?? []),
  ])
  styles.fontSize = (styles.fontSize || a.text_md.fontSize) * SCALE_MULTIPLIER
  return <div style={styles}>{children}</div>
}
