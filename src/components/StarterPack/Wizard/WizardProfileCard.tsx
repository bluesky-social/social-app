import React from 'react'
import {Keyboard, Pressable, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isWeb} from 'platform/detection'
import {useSession} from 'state/session'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {WizardAction, WizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Checkbox} from '#/components/forms/Toggle'
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
  const {currentAccount} = useSession()

  const includesProfile = state.profiles.some(p => p.did === profile.did)
  const isMe = profile.did === currentAccount?.did
  const isDisabled = isMe || state.profiles.length >= 50

  const onPressAddRemove = () => {
    if (isDisabled) return

    Keyboard.dismiss()
    if (profile.did === currentAccount?.did) return

    if (!includesProfile) {
      dispatch({type: 'AddProfile', profile})
    } else {
      dispatch({type: 'RemoveProfile', profileDid: profile.did})
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        a.flex_row,
        a.align_center,
        a.px_lg,
        a.py_sm,
        a.gap_md,
        a.border_b,
        t.atoms.border_contrast_low,
        // @ts-expect-error web only
        isWeb && {
          cursor: 'default',
        },
      ]}
      onPress={onPressAddRemove}>
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
      <Toggle.Item
        name={_(msg`Person toggle`)}
        label={
          includesProfile
            ? _(
                msg`Remove ${
                  profile.displayName || profile.handle
                } from starter pack`,
              )
            : _(
                msg`Add ${
                  profile.displayName || profile.handle
                } to starter pack`,
              )
        }
        value={includesProfile}
        disabled={isDisabled}
        onChange={onPressAddRemove}>
        <Checkbox />
      </Toggle.Item>
    </Pressable>
  )
}
