import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {type ConvoItem} from '#/state/messages/convo/types'
import {atoms as a, useTheme} from '#/alf'
import {getSystemMessageInfo} from '#/components/dms/systemMessage'
import {Text} from '#/components/Typography'

export function SystemMessageItem({
  item,
}: {
  item: ConvoItem & {type: 'system-message'}
}) {
  const t = useTheme()
  const {i18n} = useLingui()

  const info = getSystemMessageInfo(item.message.data)
  if (!info) return null

  const {Icon, message} = info

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_center,
        a.px_md,
        a.mt_md,
      ]}>
      <Icon size="xs" style={[a.mr_2xs, t.atoms.text_contrast_medium]} />
      <Text
        style={[
          a.text_xs,
          a.text_center,
          t.atoms.text_contrast_medium,
          {includeFontPadding: false, textAlignVertical: 'center'},
        ]}>
        {i18n._(message)}
      </Text>
    </View>
  )
}
