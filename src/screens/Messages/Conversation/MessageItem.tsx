import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import * as TempDmChatDefs from '#/temp/dm/defs'

export function MessageItem({item}: {item: TempDmChatDefs.MessageView}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.py_sm,
        a.px_md,
        a.my_xs,
        a.rounded_md,
        {
          backgroundColor: t.palette.primary_500,
          maxWidth: '65%',
          borderRadius: 17,
        },
      ]}>
      <Text style={[a.text_md, {lineHeight: 1.2, color: 'white'}]}>
        {item.text}
      </Text>
    </View>
  )
}
