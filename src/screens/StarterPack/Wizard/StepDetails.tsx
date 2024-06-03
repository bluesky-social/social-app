import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {StarterPackIcon} from '#/components/icons/StarterPackIcon'
import {Text} from '#/components/Typography'

export function StepDetails() {
  const {_} = useLingui()
  const [state, dispatch] = useWizardState()

  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 300,
  })

  return (
    <View style={[a.px_xl, a.gap_2xl, a.mt_md]}>
      <View style={[{height: 65, marginTop: 20}]}>
        <StarterPackIcon />
      </View>
      <View style={[a.gap_xs, a.align_center]}>
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
      <View>
        <TextField.LabelText>{_(msg`Starter pack name`)}</TextField.LabelText>
        <TextField.Input
          label={_(
            msg`${
              currentProfile?.displayName || currentProfile?.handle
            }'s starter pack`,
          )}
          value={state.name}
          onChangeText={text => dispatch({type: 'SetName', name: text})}
        />
      </View>
      <View>
        <TextField.LabelText>{_(msg`Description`)}</TextField.LabelText>
        <TextField.Root>
          <TextField.Input
            label={_(
              msg`Write a short description of your starter pack. What can new users expect?`,
            )}
            value={state.description}
            onChangeText={text =>
              dispatch({type: 'SetDescription', description: text})
            }
            multiline
            style={{minHeight: 150}}
          />
        </TextField.Root>
      </View>
    </View>
  )
}
