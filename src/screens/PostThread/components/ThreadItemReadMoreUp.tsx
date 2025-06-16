import {memo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type ThreadItem} from '#/state/queries/usePostThread'
import {
  LINEAR_AVI_WIDTH,
  OUTER_SPACE,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {ArrowTopCircle_Stroke2_Corner0_Rounded as UpIcon} from '#/components/icons/ArrowTopCircle'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export const ThreadItemReadMoreUp = memo(function ThreadItemReadMoreUp({
  item,
}: {
  item: Extract<ThreadItem, {type: 'readMoreUp'}>
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Link
      label={_(msg`Continue thread`)}
      to={item.href}
      style={[
        a.gap_xs,
        {
          paddingTop: OUTER_SPACE,
          paddingHorizontal: OUTER_SPACE,
        },
      ]}>
      {({hovered, pressed}) => {
        const interacted = hovered || pressed
        return (
          <View>
            <View style={[a.flex_row, a.align_center, a.gap_md]}>
              <View
                style={[
                  a.align_center,
                  {
                    width: LINEAR_AVI_WIDTH,
                  },
                ]}>
                <UpIcon
                  fill={
                    interacted
                      ? t.atoms.text_contrast_high.color
                      : t.atoms.text_contrast_low.color
                  }
                  width={24}
                />
              </View>
              <Text
                style={[
                  a.text_sm,
                  t.atoms.text_contrast_medium,
                  interacted && [a.underline],
                ]}>
                <Trans>Continue thread...</Trans>
              </Text>
            </View>
            <View
              style={[
                a.align_center,
                {
                  width: LINEAR_AVI_WIDTH,
                },
              ]}>
              <View
                style={[
                  a.mt_xs,
                  {
                    height: OUTER_SPACE / 2,
                    width: REPLY_LINE_WIDTH,
                    backgroundColor: t.atoms.border_contrast_low.borderColor,
                  },
                ]}
              />
            </View>
          </View>
        )
      }}
    </Link>
  )
})
