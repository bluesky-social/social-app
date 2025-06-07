import {useMemo} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LINEAR_AVI_WIDTH, OUTER_SPACE} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Text} from '#/components/Typography'

export type ThreadItemPostTombstoneProps = {
  type: 'not-found' | 'blocked'
}

export function ThreadItemPostTombstone({type}: ThreadItemPostTombstoneProps) {
  const t = useTheme()
  const {_} = useLingui()
  const copy = useMemo(() => {
    switch (type) {
      case 'blocked':
        return _(msg`Post blocked.`)
      case 'not-found':
      default:
        return _(msg`Post not found.`)
    }
  }, [_, type])

  return (
    <View
      style={[
        a.mb_xs,
        {
          paddingHorizontal: OUTER_SPACE,
          paddingTop: OUTER_SPACE / 1.2,
        },
      ]}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
          {
            paddingVertical: OUTER_SPACE / 1.2,
          },
        ]}>
        <View
          style={[
            a.flex_row,
            a.justify_center,
            {
              width: LINEAR_AVI_WIDTH,
            },
          ]}>
          <TrashIcon style={[t.atoms.text]} />
        </View>
        <Text style={[a.font_bold, a.text_md, t.atoms.text_contrast_medium]}>
          {copy}
        </Text>
      </View>
    </View>
  )
}
