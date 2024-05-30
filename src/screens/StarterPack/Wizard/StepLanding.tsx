import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Text} from '#/components/Typography'

export function StepLanding() {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.justify_center, {marginTop: 100}]}>
      <View style={[{height: 150, marginBottom: 50}]}>
        <StarterPackIcon />
      </View>
      <View style={[a.gap_lg, a.align_center, a.px_md]}>
        <Text style={[a.font_bold, a.text_lg, t.atoms.text_contrast_medium]}>
          <Trans>Starter packs</Trans>
        </Text>
        <Text style={[a.font_bold, a.text_4xl]}>
          <Trans>Invites, but personal</Trans>
        </Text>
        <Text style={[a.text_center, a.text_md, a.px_md]}>
          <Trans>
            Create your own Bluesky starter packs and invite people directly to
            your favorite feeds, profiles, and more.
          </Trans>
        </Text>
      </View>
    </View>
  )
}
