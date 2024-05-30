import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView, ScrollView} from 'view/com/util/Views'
import {Step, useWizardState} from '#/screens/StarterPack/Wizard/State'
import {StepLanding} from '#/screens/StarterPack/Wizard/StepLanding'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Provider} from './State'

export function Wizard() {
  return (
    <Provider>
      <WizardInner />
    </Provider>
  )
}

function WizardInner() {
  const {_} = useLingui()
  const bottomOffset = useBottomBarOffset()
  const [state, dispatch] = useWizardState()

  const wizardUiStrings: Record<Step, {header: string; button: string}> = {
    Landing: {
      header: _(msg`Create a starter pack`),
      button: _(msg`Create`),
    },
    Details: {
      header: _(msg`Details`),
      button: _(msg`Continue`),
    },
    Profiles: {
      header: _(msg`Add profiles`),
      button: _(msg`Continue`),
    },
    Feeds: {
      header: _(msg`Add feeds`),
      button: _(msg`Continue`),
    },
    Review: {
      header: _(msg`Review`),
      button: _(msg`Continue`),
    },
    Finished: {
      header: _(msg`Finished`),
      button: _(msg`Visit Starter Pack`),
    },
  }

  const uiStrings = wizardUiStrings[state.currentStep]

  return (
    <CenteredView style={[a.flex_1, {marginBottom: bottomOffset + 20}]}>
      <ViewHeader
        title={uiStrings.header}
        onBackPress={
          state.currentStep !== 'Landing'
            ? () => dispatch({type: 'Back'})
            : undefined
        }
      />
      <ScrollView style={[a.flex_1]} contentContainerStyle={[a.flex_1]}>
        <StepView />
      </ScrollView>
      <View style={a.px_md}>
        <Button
          label={uiStrings.button}
          variant="solid"
          color="primary"
          size="large"
          onPress={() => dispatch({type: 'Next'})}>
          <ButtonText>{uiStrings.button}</ButtonText>
        </Button>
      </View>
    </CenteredView>
  )
}

function StepView() {
  const [state] = useWizardState()

  if (state.currentStep === 'Landing') {
    return <StepLanding />
  }
}
