import React from 'react'
import {z} from 'zod'

import {Text} from '#/components/Typography'
import {useFontColor} from './hooks'

const labelProps = z.object({
  text: z.string(),
  color: z
    .enum([
      'default',
      'primary',
      'secondary',
      'positive',
      'negative',
      'inverted',
    ])
    .default('default'),
  size: z
    .number()
    .positive()
    .default(16)
    .transform(v => ({fontSize: v})),
  lineHeight: z
    .number()
    .positive()
    .default(1)
    .transform(v => ({lineHeight: v})),
  weight: z
    .enum(['normal', 'semibold', 'bold'])
    .default('normal')
    .transform(v => ({fontWeight: v})),
})

export type LabelProps = z.infer<typeof labelProps>

export function Label(props: React.PropsWithChildren<LabelProps>) {
  const styles = labelProps.parse(props)
  const fontColor = useFontColor(styles.color)
  return (
    <Text style={[fontColor, styles.size, styles.lineHeight, styles.weight]}>
      {props.text}
    </Text>
  )
}
