import React from 'react'
import {FlexAlignType, FlexStyle, View} from 'react-native'
import {z} from 'zod'

import {gap, pad} from './common'

const stackProps = z.object({
  gap,
  pad,

  direction: z
    .enum(['row', 'column'])
    .default('column')
    .transform(v => ({flexDirection: v})),

  align: z
    .enum(['start', 'center', 'end', 'stretch'])
    .default('stretch')
    .transform(v => {
      if (v === 'start') {
        return {alignItems: 'flex-start' as FlexAlignType}
      }
      if (v === 'end') {
        return {alignItems: 'flex-end' as FlexAlignType}
      }
      return {alignItems: v as FlexAlignType}
    }),

  justify: z
    .enum([
      'start',
      'center',
      'end',
      'space-between',
      'space-around',
      'space-evenly',
    ])
    .default('start')
    .transform(v => {
      if (v === 'start') {
        return {justifyContent: 'flex-start' as FlexStyle['justifyContent']}
      }
      if (v === 'end') {
        return {justifyContent: 'flex-end' as FlexStyle['justifyContent']}
      }
      return {justifyContent: v as FlexStyle['justifyContent']}
    }),
})

export type StackProps = z.infer<typeof stackProps>

export function Stack(props: React.PropsWithChildren<StackProps>) {
  const styles = stackProps.parse(props)
  return (
    <View
      style={[
        {flexWrap: 'nowrap'},
        styles.direction,
        styles.align,
        styles.justify,
        styles.gap,
        styles.pad,
      ]}>
      {props.children}
    </View>
  )
}
