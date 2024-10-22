import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {StarterPack} from '#/components/icons/StarterPack'
import {ScreenTransition} from '#/components/StarterPack/Wizard/ScreenTransition'
import {Text} from '#/components/Typography'
import {useWizardState} from './State'

export function StepDetails() {
  const {_} = useLingui()
  const t = useTheme()
  const [state, dispatch] = useWizardState()

  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: 300,
  })

  return (
    <ScreenTransition direction={state.transitionDirection}>
      <View style={[a.px_xl, a.gap_xl, a.mt_4xl]}>
        <View style={[a.gap_md, a.align_center, a.px_md, a.mb_md]}>
          <StarterPack width={90} gradient="sky" />
          <Text style={[a.font_bold, a.text_3xl]}>
            <Trans>Your own feed</Trans>
          </Text>
          <Text style={[a.text_center, a.text_md, a.px_md]}>
            <Trans>Curate your and other people's posts into a feed</Trans>
          </Text>
        </View>
        <View>
          <TextField.LabelText>
            <Trans>What do you want to call your feed?</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              label={_(`My feed`)}
              value={state.name}
              onChangeText={text => dispatch({type: 'SetName', name: text})}
            />
            <TextField.SuffixText label={_(`${state.name?.length} out of 24`)}>
              <Text style={[t.atoms.text_contrast_medium]}>
                {state.name?.length ?? 0}/24
              </Text>
            </TextField.SuffixText>
          </TextField.Root>
        </View>
        <View>
          <TextField.LabelText>
            <Trans>Tell us a little more</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              label={_(
                msg`${
                  currentProfile?.displayName || currentProfile?.handle
                }'s favorite posts`,
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
    </ScreenTransition>
  )
}
