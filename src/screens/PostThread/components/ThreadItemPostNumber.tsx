import {Text, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

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
  const {t: l} = useLingui()
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
        accessibilityLabel={l({
          message: `Post ${index} of ${count}`,
          context: 'post-number-in-thread',
          comment:
            "Screen reader label indicating post count in a thread, e.g., the 3rd post of 5 total is 'Post 3 of 5'",
        })}
        accessibilityHint=""
        style={[
          a.text_xs,
          a.font_medium,
          t.atoms.text_contrast_high,
          {
            fontVariant: ['tabular-nums'],
          },
        ]}>
        <Trans
          context="post-number-in-thread"
          comment="Badge indicating post count in a thread, e.g., the 3rd post of 5 total is '3/5'">
          {index}/{count}
        </Trans>
      </Text>
    </View>
  )
}
