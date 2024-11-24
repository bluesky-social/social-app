import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useWizardState} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {StarterPack} from '#/components/icons/StarterPack'
import {ScreenTransition} from '#/components/StarterPack/Wizard/ScreenTransition'
import {Text} from '#/components/Typography'

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
            <Trans>Invites, but personal</Trans>
          </Text>
          <Text style={[a.text_center, a.text_md, a.px_md]}>
            <Trans>
              Invite your friends to follow your favorite feeds and people
            </Trans>
          </Text>
        </View>
        <View>
          <TextField.LabelText>
            <Trans>What do you want to call your starter pack?</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Input
              label={_(
                msg`${
                  currentProfile?.displayName || currentProfile?.handle
                }'s starter pack`,
              )}
              value={state.name}
              onChangeText={text => dispatch({type: 'SetName', name: text})}
            />
            <TextField.SuffixText label={_(`${state.name?.length} out of 50`)}>
              <Text style={[t.atoms.text_contrast_medium]}>
                {state.name?.length ?? 0}/50
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
                }'s favorite feeds and people - join me!`,
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
