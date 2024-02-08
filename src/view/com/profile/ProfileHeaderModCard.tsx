import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import LinearGradient from 'react-native-linear-gradient'

import {atoms as a, useTheme, tokens, web} from '#/alf'
import {Link, useLinkContext} from '#/components/Link'
import {Text} from '#/components/Typography'
import {RichText} from '#/components/RichText'
import {RaisingHande4Finger_Stroke2_Corner0_Rounded as RaisingHand} from '#/components/icons/RaisingHand'

export function ProfileHeaderModCard() {
  const {_} = useLingui()

  return (
    <Link
      to="/profile/alice.test/modservice"
      label={_(msg`View the moderation service provided by this profile`)}>
      <Inner />
    </Link>
  )
}

function Inner() {
  const t = useTheme()
  const {hovered, pressed, focused} = useLinkContext()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_sm,
        a.w_full,
        a.rounded_sm,
        a.pt_md,
        a.pb_sm,
        a.pl_lg,
        a.pr_sm,
        a.overflow_hidden,
        web({
          transition: 'transform 0.2s cubic-bezier(.02,.73,.27,.99)',
        }),
        {
          transform: [{scale: pressed || hovered || focused ? 0.992 : 1}],
        },
      ]}>
      <LinearGradient
        colors={tokens.gradients.bonfire.values.map(c => c[1])}
        locations={tokens.gradients.bonfire.values.map(c => c[0])}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[a.absolute, a.inset_0]}
      />

      <View style={[a.z_10]}>
        <Text
          style={[a.text_md, a.font_bold, a.pb_2xs, {color: t.palette.white}]}>
          <Trans>Moderation service</Trans>
        </Text>

        <RichText
          value={'Moderation service managed by bsky.app'}
          style={[{color: t.palette.white}]}
        />
      </View>

      <RaisingHand size="xl" style={[a.z_10]} fill={t.palette.white} />
    </View>
  )
}
