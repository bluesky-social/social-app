import React from 'react'

import {atoms as a} from '../theme/index.js'
import {Box} from './Box.js'

export function Row({
  children,
  gutter = 0,
  cx,
}: {
  children: React.ReactNode
  gutter?: number
  cx?: Record<string, any>[]
}) {
  return (
    <Box
      cx={[
        a.flex_row,
        {
          marginLeft: -gutter,
          marginRight: -gutter,
        },
        ...(cx || []),
      ]}>
      {children}
    </Box>
  )
}

export function Column({
  children,
  gutter = 0,
  cx,
  width = 1,
}: {
  children: React.ReactNode
  gutter?: number
  cx?: Record<string, any>[]
  width?: number
}) {
  return (
    <Box
      cx={[
        a.flex_col,
        {
          paddingLeft: gutter,
          paddingRight: gutter,
          width: `${width * 100}%`,
        },
        ...(cx || []),
      ]}>
      {children}
    </Box>
  )
}
