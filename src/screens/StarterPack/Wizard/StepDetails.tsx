import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a} from '#/alf'
import * as TextField from '#/components/forms/TextField'

export function StepDetails() {
  const {_} = useLingui()
  const [state, dispatch] = useWizardState()

  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 300,
  })

  return (
    <View style={[a.px_xl, a.gap_xl, a.mt_md]}>
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
