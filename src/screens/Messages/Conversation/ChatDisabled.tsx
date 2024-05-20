import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function ChatDisabled() {
  const t = useTheme()
  return (
    <View style={[a.p_md]}>
      <View style={[a.p_xl, a.rounded_md, t.atoms.bg_contrast_25]}>
        <Text
          style={[a.text_md, a.font_bold, a.pb_sm, t.atoms.text_contrast_high]}>
          <Trans>Your chats have been disabled</Trans>
        </Text>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Our moderators have reviewed reports and decided to disable your
            access to chats on Bluesky.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
