import {Text, View} from 'react-native'

import {atoms as a, native, platform, useTheme} from '#/alf'

// TODO: Remove this mock once @atproto/api includes these lexicon fields.
export type ThreadItemPostNumbering = {
  opThreadPostIndex?: number
  opThreadPostCount?: number
}

export function hasThreadItemPostNumber(value: ThreadItemPostNumbering) {
  const index = value.opThreadPostIndex
  const count = value.opThreadPostCount

  return (
    index !== undefined &&
    count !== undefined &&
    index >= 1 &&
    count >= 1 &&
    index <= count
  )
}

export function ThreadItemPostNumber({
  value,
  inline = true,
}: {
  value: ThreadItemPostNumbering
  inline?: boolean
}) {
  const t = useTheme()
  const index = value.opThreadPostIndex
  const count = value.opThreadPostCount

  if (!hasThreadItemPostNumber(value)) {
    return null
  }

  return (
    <View
      style={[
        a.flex_shrink_0,
        a.rounded_full,
        t.atoms.bg_contrast_50,
        native(a.py_2xs),
        {
          paddingLeft: 5,
          paddingRight: 5,
        },
        inline
          ? platform({
              native: {transform: [{translateY: 6}]},
              web: {top: -2},
            })
          : {top: -2},
      ]}>
      <Text
        style={[
          a.text_xs,
          a.font_medium,
          t.atoms.text_contrast_high,
          {
            fontVariant: ['tabular-nums'],
          },
        ]}>
        {index}/{count}
      </Text>
    </View>
  )
}
