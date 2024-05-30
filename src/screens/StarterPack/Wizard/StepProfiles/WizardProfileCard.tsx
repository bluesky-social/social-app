import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WizardProfileCard() {
  const {_} = useLingui()
  const t = useTheme()
  const [state, dispatch] = useWizardState()

  // TODO remove this
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})

  const includesProfile =
    profile?.did && state.profileDids.includes(profile.did)

  const onAdd = () => {
    if (!profile?.did) return

    if (!includesProfile) {
      dispatch({type: 'AddProfile', did: profile.did})
    } else {
      dispatch({type: 'RemoveProfile', did: profile.did})
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
        color="primary"
        size="small"
        style={{paddingVertical: 6}}
        onPress={onAdd}>
        <ButtonText>
          {includesProfile ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
