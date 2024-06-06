import React from 'react'
import {View} from 'react-native'
import {z} from 'zod'

import {pad} from './common'
import {useBackgroundColor, useBorderColor} from './hooks'

const boxProps = z.object({
  pad,

  corner: z
    .union([
      z
        .number()
        .positive()
        .transform(v => ({borderRadius: v})),
      z
        .object({
          tl: z.number().positive().optional(),
          tr: z.number().positive().optional(),
          bl: z.number().positive().optional(),
          br: z.number().positive().optional(),
        })
        .transform(obj => ({
          borderTopLeftRadius: obj.tl,
          borderTopRightRadius: obj.tr,
          borderBottomLeftRadius: obj.bl,
          borderBottomRightRadius: obj.br,
        })),
    ])
    .optional(),

  background: z
    .enum([
      'default',
      'primary',
      'secondary',
      'positive',
      'negative',
      'inverted',
      'none',
    ])
    .optional(),

  border: z
    .enum([
      'default',
      'primary',
      'secondary',
      'positive',
      'negative',
      'inverted',
      'none',
    ])
    .optional(),
})

export type BoxProps = z.infer<typeof boxProps>

export function Box(props: React.PropsWithChildren<BoxProps>) {
  const styles = boxProps.parse(props)

  const backgroundColor = useBackgroundColor(styles.background)
  const borderColor = useBorderColor(styles.border)

  return (
    <View style={[styles.pad, styles.corner, backgroundColor, borderColor]}>
      {props.children}
    </View>
  )
}
