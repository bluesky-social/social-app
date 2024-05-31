import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {UserAvatar} from 'view/com/util/UserAvatar'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WizardProfileCard({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [__, dispatch] = useWizardState()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.px_md,
        a.py_sm,
        a.gap_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <UserAvatar size={45} avatar={profile?.avatar} />
      <View style={[a.flex_1]}>
        <Text style={[a.flex_1, a.font_bold, a.text_md]} numberOfLines={1}>
          {profile?.displayName || profile?.handle}
        </Text>
        <Text
          style={[a.flex_1, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          @{profile?.handle}
        </Text>
      </View>
      <Button
        label={_(msg`Remove`)}
        variant="solid"
        color="primary"
        size="small"
        style={{paddingVertical: 6}}
        onPress={() => {
          dispatch({
            type: 'RemoveProfile',
            profileDid: profile.did,
          })
        }}>
        <ButtonText>
          <Trans>Remove</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
