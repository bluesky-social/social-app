import {atoms as a} from '#/alf'
import React from 'react'
import {Context} from '#/screens/Onboarding/state'
import {View} from 'react-native'
import {
  Description,
  OnboardingControls,
  Title,
} from '#/screens/Onboarding/Layout'
import {configurableLabelGroups} from 'state/queries/preferences'
import {Divider} from '#/components/Divider'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {ModerationOption} from '#/screens/Onboarding/StepModeration/ModerationOption'
import {AdultContentEnabledPref} from '#/screens/Onboarding/StepModeration/AdultContentEnabledPref'

export function StepModeration() {
  const {state, dispatch} = React.useContext(Context)

  return (
    <View style={[a.align_start]}>
      <Title>You have control</Title>
      <Description style={[a.mb_xl]}>
        Select the types of content that you want to see, and we'll handle the
        rest.
      </Description>

      <AdultContentEnabledPref />

      <View style={[a.gap_sm, a.w_full]}>
        {configurableLabelGroups.map((g, index) => (
          <React.Fragment key={index}>
            {index === 0 && <Divider />}
            <ModerationOption labelGroup={g} />
            <Divider />
          </React.Fragment>
        ))}
      </View>

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
