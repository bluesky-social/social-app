import React from 'react'
import {View} from 'react-native'

import {atoms as a, useBreakpoints} from '#/alf'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'

import {Context} from '#/screens/Onboarding/context'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

export function StepSuggestedFollows() {
  const {state, dispatch} = React.useContext(Context)
  const {gtMobile} = useBreakpoints()

  return (
    <View style={[a.align_start]}>
      <Title>Here are some accounts for your to follow:</Title>
      <Description>Based on your interest in Pets and Books.</Description>

      <OnboardingControls.Portal>
        <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
          <Button
            key={state.activeStep} // remove focus state on nav
            variant="gradient"
            color="gradient_sky"
            size="large"
            label="Continue setting up your account"
            onPress={() => dispatch({type: 'next'})}>
            <ButtonText>Follow All</ButtonText>
            <ButtonIcon icon={Plus} />
          </Button>
          <Button
            key={state.activeStep + '2'} // remove focus state on nav
            variant="outline"
            color="secondary"
            size="large"
            label="Continue setting up your account"
            onPress={() => dispatch({type: 'next'})}>
            Skip
          </Button>
        </View>
      </OnboardingControls.Portal>
    </View>
  )
}
