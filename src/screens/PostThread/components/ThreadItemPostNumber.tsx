import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

// TODO: Remove this mock once @atproto/api includes these lexicon fields.
export type ThreadItemPostNumbering = {
  opThreadPostIndex?: number
  opThreadPostCount?: number
}

export function ThreadItemPostNumber({
  value,
}: {
  value: ThreadItemPostNumbering
}) {
  const t = useTheme()
  const index = value.opThreadPostIndex
  const count = value.opThreadPostCount

  if (
    index === undefined ||
    count === undefined ||
    index < 1 ||
    count < 1 ||
    index > count
  ) {
    return null
  }

  return (
    <View
      style={[
        a.flex_shrink_0,
        a.rounded_full,
        a.px_sm,
        a.py_2xs,
        t.atoms.bg_contrast_25,
      ]}>
      <Text style={[a.text_xs, a.font_semi_bold, t.atoms.text_contrast_medium]}>
        {index}/{count}
      </Text>
    </View>
  )
}
