import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAgent, useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function ChangeEmailDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner control={control} />
    </Dialog.Outer>
  )
}

function Inner({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const [currentStep, setCurrentStep] = React.useState<'StepOne' | 'StepTwo'>(
    'StepOne',
  )

  const uiStrings = {
    StepOne: {
      title: _(msg`Change Email`),
      message: _(msg`Enter your new email address below.`),
    },
    StepTwo: {
      title: _(msg),
      message: '',
    },
  }

  return (
    <Dialog.ScrollableInner label={_(msg`Change email dialog`)}>
      <View style={[a.gap_xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_heavy, a.text_2xl]}>{_(msg`Change email`)}</Text>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
