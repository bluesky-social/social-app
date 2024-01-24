import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useTheme, useBreakpoints} from '#/alf'
import {configurableLabelGroups} from 'state/queries/preferences'
import {Divider} from '#/components/Divider'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'

import {
  Description,
  OnboardingControls,
  Title,
} from '#/screens/Onboarding/Layout'
import {ModerationOption} from '#/screens/Onboarding/StepModeration/ModerationOption'
import {AdultContentEnabledPref} from '#/screens/Onboarding/StepModeration/AdultContentEnabledPref'
import {Context} from '#/screens/Onboarding/state'

export function StepModeration() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)

  return (
    <View style={[a.align_start, {paddingTop: gtMobile ? 100 : 60}]}>
      <View
        style={[
          a.p_lg,
          a.mb_3xl,
          a.rounded_full,
          {
            backgroundColor:
              t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
          },
        ]}>
        <EyeSlash size="xl" fill={t.palette.primary_500} />
      </View>

      <Title>
        <Trans>You are in control</Trans>
      </Title>
      <Description style={[a.mb_xl]}>
        <Trans>
          Select the types of content that you want to see (or not see), and
          we'll handle the rest.
        </Trans>
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
          label={_(msg`Continue to next step`)}
          onPress={() => dispatch({type: 'next'})}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={ChevronRight} position="right" />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
