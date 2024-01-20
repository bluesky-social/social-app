import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'

import {Context} from '#/screens/Onboarding/context'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

export function StepAlgoFeeds() {
  const {state, dispatch} = React.useContext(Context)

  return (
    <View style={[a.align_start]}>
      <Title>Choose your algorithmic feeds</Title>
      <Description>
        Feeds are created by users and can give you entirely new experiences.
      </Description>

      <OnboardingControls.Portal>
        <Button
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={() => dispatch({type: 'next'})}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
