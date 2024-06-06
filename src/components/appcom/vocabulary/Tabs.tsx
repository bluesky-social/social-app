import React from 'react'
import {View} from 'react-native'
import {z} from 'zod'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

const tabsProps = z.object({
  labels: z.array(z.string()),
})

export type TabsProps = z.infer<typeof tabsProps>

export function Tabs(props: React.PropsWithChildren<TabsProps>) {
  const t = useTheme()

  const [selected, setSelected] = React.useState(0)
  const propsParsed = tabsProps.parse(props)

  return (
    <View>
      <View style={[a.flex_row]}>
        {propsParsed.labels.map((label, i) => (
          <Button
            key={`${i}-${label}`}
            onPress={() => setSelected(i)}
            label={label}>
            {({hovered}) => (
              <View
                style={[
                  a.px_lg,
                  a.py_md,
                  a.border_b,
                  hovered && t.atoms.bg_contrast_25,
                  {
                    borderColor:
                      hovered || selected === i
                        ? t.palette.black
                        : 'transparent',
                  },
                ]}>
                <Text style={[t.atoms.text, a.text_md]}>{label}</Text>
              </View>
            )}
          </Button>
        ))}
      </View>
      {arr(props.children).map((child, i) => (
        <View
          key={`tab-content-${i}`}
          style={{display: i === selected ? 'flex' : 'none'}}>
          {child}
        </View>
      ))}
    </View>
  )
}

function arr(v: any): Array<any> {
  if (Array.isArray(v)) {
    return v
  }
  if (!v) {
    return []
  }
  return [v]
}
