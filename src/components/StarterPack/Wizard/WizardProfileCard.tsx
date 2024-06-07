import React from 'react'
import {Keyboard, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {UserAvatar} from 'view/com/util/UserAvatar'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WizardProfileCard({
  state,
  dispatch,
  profile,
}: {
  state: WizardState
  dispatch: (action: WizardAction) => void
  profile: AppBskyActorDefs.ProfileViewBasic
}) {
  const {_} = useLingui()
  const t = useTheme()

  const includesProfile = state.profiles.some(p => p.did === profile.did)

  const onPressAddRemove = () => {
    Keyboard.dismiss()

    if (!profile?.did) return
    if (!includesProfile) {
      dispatch({type: 'AddProfile', profile})
    } else {
      dispatch({type: 'RemoveProfile', profileDid: profile.did})
    }
  }

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
        label={includesProfile ? _(msg`Remove`) : _(msg`Add`)}
        variant="solid"
        color={includesProfile ? 'secondary' : 'primary'}
        size="small"
        style={{paddingVertical: 6}}
        onPress={onPressAddRemove}>
        <ButtonText>
          {includesProfile ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
