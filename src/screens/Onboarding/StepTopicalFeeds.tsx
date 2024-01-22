import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

export function StepTopicalFeeds() {
  const {state, dispatch} = React.useContext(Context)

  return (
    <View style={[a.align_start]}>
      <Title>Feeds can be topic-based as well!</Title>
      <Description>
        Here are some topic-based feeds based on your interests in Pets and
        Books.
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
