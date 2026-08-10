import {Text, View} from 'react-native'
import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, native, platform, useTheme} from '#/alf'
import {useAnalytics} from '#/analytics'

/**
 * How far the inline badge is nudged below the text baseline to optically
 * center it. The containing `RichText` must reserve matching room via
 * `suffixOffset`, or iOS clips the overflow.
 */
export const POST_NUMBER_INLINE_OFFSET = 6

export function useHasThreadItemPostNumber(
  value: AppBskyUnspeccedDefs.ThreadItemPost,
) {
  const ax = useAnalytics()
  const index = value.opThreadPostIndex
  const count = value.opThreadPostCount

  return (
    ax.features.enabled(ax.features.CanonicalPostNumberingEnable) &&
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
  value: AppBskyUnspeccedDefs.ThreadItemPost
  inline?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const shouldRender = useHasThreadItemPostNumber(value)
  const index = value.opThreadPostIndex
  const count = value.opThreadPostCount

  if (!shouldRender) {
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
              native: {transform: [{translateY: POST_NUMBER_INLINE_OFFSET}]},
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
