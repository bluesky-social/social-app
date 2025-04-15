import {useCallback} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {type DialogControlProps} from '#/components/Dialog'
import {VerifiedCheck} from '#/components/icons/VerifiedCheck'
import * as Prompt from '#/components/Prompt'

export function VerificationCreatePrompt({
  control,
  userName,
}: {
  control: DialogControlProps
  userName: string
}) {
  const {_} = useLingui()
  const onConfirm = useCallback(() => {}, [])

  return (
    <Prompt.Outer control={control}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.pb_sm]}>
        <VerifiedCheck width={18} />
        <Prompt.TitleText style={[a.pb_0]}>
          {_(msg`Verify ${userName}`)}
        </Prompt.TitleText>
      </View>
      <Prompt.DescriptionText>
        {_(
          msg`Would you like to verify ${userName}’s account? This can be undone at anytime.`,
        )}
      </Prompt.DescriptionText>
      <Prompt.Actions>
        <Prompt.Action cta={_(msg`Verify account`)} onPress={onConfirm} />
        <Prompt.Cancel />
      </Prompt.Actions>
    </Prompt.Outer>
  )
}
