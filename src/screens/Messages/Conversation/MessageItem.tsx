import React from 'react'
import {View} from 'react-native'

import {useAgent} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as TempDmChatDefs from '#/temp/dm/defs'

export function MessageItem({item}: {item: TempDmChatDefs.MessageView}) {
  const t = useTheme()
  const {getAgent} = useAgent()

  const fromMe = item.sender?.did === getAgent().session?.did

  return (
    <View
      style={[
        a.py_sm,
        a.px_md,
        a.my_xs,
        a.rounded_md,
        fromMe ? a.self_end : a.self_start,
        {
          backgroundColor: fromMe
            ? t.palette.primary_500
            : t.palette.contrast_50,
          maxWidth: '65%',
          borderRadius: 17,
        },
      ]}>
      <Text
        style={[a.text_md, a.leading_snug, fromMe && {color: t.palette.white}]}>
        {item.text}
      </Text>
    </View>
  )
}
