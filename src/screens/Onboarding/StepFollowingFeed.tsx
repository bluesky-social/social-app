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

export function StepFollowingFeed() {
  const {state, dispatch} = React.useContext(Context)

  return (
    <View style={[a.align_start]}>
      <Title>Your default feed is "Following"</Title>
      <Description>
        It only show posts from the people your follow, in the order they were
        posted.
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
