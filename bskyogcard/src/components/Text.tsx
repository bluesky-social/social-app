import React from 'react'

import {atoms as a, style as s, theme as t} from '../theme/index.js'

export function Text({
  children,
  cx,
}: {
  children?: React.ReactNode
  cx?: Record<string, any>[]
}) {
  return (
    <div
      style={s([
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
      ])}>
      {children}
    </div>
  )
}
