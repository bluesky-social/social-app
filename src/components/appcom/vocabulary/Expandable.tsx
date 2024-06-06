import React from 'react'
import {View} from 'react-native'
import {z} from 'zod'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottom,
  ChevronRight_Stroke2_Corner0_Rounded as ChevronRight,
} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

const expandableProps = z.object({
  label: z.string(),
  defaultExpanded: z.boolean().default(false),
})

export type ExpandableProps = z.infer<typeof expandableProps>

export function Expandable(props: React.PropsWithChildren<ExpandableProps>) {
  const t = useTheme()

  const propsParsed = expandableProps.parse(props)
  const [expanded, setExpanded] = React.useState(propsParsed.defaultExpanded)

  return (
    <View>
      <Button onPress={() => setExpanded(v => !v)} label={propsParsed.label}>
        {({hovered}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.px_md,
              a.py_md,
              a.rounded_xs,
              hovered && t.atoms.bg_contrast_25,
            ]}>
            {expanded ? (
              <ChevronBottom
                width={14}
                fill={t.atoms.text_contrast_low.color}
              />
            ) : (
              <ChevronRight width={14} fill={t.atoms.text_contrast_low.color} />
            )}
            <Text style={[t.atoms.text, a.text_md]}>{props.label}</Text>
          </View>
        )}
      </Button>
      <View style={{display: expanded ? 'flex' : 'none'}}>
        {props.children}
      </View>
    </View>
  )
}
