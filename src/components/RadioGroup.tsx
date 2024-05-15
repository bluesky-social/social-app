import React from 'react'
import {View, ViewProps} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Button} from './Button'
import {Text} from './Typography'

export function RadioGroup<T extends string | number>({
  value,
  onSelect,
  items,
  ...props
}: ViewProps & {
  value: T
  onSelect: (value: T) => void
  items: Array<{label: string; value: T}>
}) {
  return (
    <View {...props}>
      {items.map(item => (
        <Button
          label={item.label}
          key={item.value}
          variant="ghost"
          color="secondary"
          size="small"
          onPress={() => onSelect(item.value)}
          style={[a.justify_between, a.px_sm]}>
          <Text style={a.text_md}>{item.label}</Text>
          <RadioIcon selected={value === item.value} />
        </Button>
      ))}
    </View>
  )
}

function RadioIcon({selected}: {selected: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        {
          width: 30,
          height: 30,
          borderWidth: 2,
          borderColor: selected
            ? t.palette.primary_500
            : t.palette.contrast_200,
        },
        selected
          ? {
              backgroundColor:
                t.name === 'light'
                  ? t.palette.primary_100
                  : t.palette.primary_900,
            }
          : t.atoms.bg,
        a.align_center,
        a.justify_center,
        a.rounded_full,
      ]}>
      {selected && (
        <View
          style={[
            {
              width: 18,
              height: 18,
              backgroundColor: t.palette.primary_500,
            },
            a.rounded_full,
          ]}
        />
      )}
    </View>
  )
}
