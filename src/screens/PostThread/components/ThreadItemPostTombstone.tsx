import {useMemo} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LINEAR_AVI_WIDTH, OUTER_SPACE} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {PersonX_Stroke2_Corner0_Rounded as PersonXIcon} from '#/components/icons/Person'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Text} from '#/components/Typography'

export type ThreadItemPostTombstoneProps = {
  type: 'not-found' | 'blocked'
}

export function ThreadItemPostTombstone({type}: ThreadItemPostTombstoneProps) {
  const t = useTheme()
  const {_} = useLingui()
  const {copy, Icon} = useMemo(() => {
    switch (type) {
      case 'blocked':
        return {copy: _(msg`Post blocked`), Icon: PersonXIcon}
      case 'not-found':
      default:
        return {copy: _(msg`Post not found`), Icon: TrashIcon}
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
          {paddingVertical: OUTER_SPACE / 1.2},
        ]}>
        <View style={[a.flex_row, a.justify_center, {width: LINEAR_AVI_WIDTH}]}>
          <Icon style={[t.atoms.text_contrast_medium]} />
        </View>
        <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
          {copy}
        </Text>
      </View>
    </View>
  )
}
