import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useBreakpoints} from '#/alf'
import {configurableLabelGroups} from 'state/queries/preferences'
import {Divider} from '#/components/Divider'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {Loader} from '#/components/Loader'

import {
  Description,
  OnboardingControls,
  Title,
} from '#/screens/Onboarding/Layout'
import {ModerationOption} from '#/screens/Onboarding/StepModeration/ModerationOption'
import {AdultContentEnabledPref} from '#/screens/Onboarding/StepModeration/AdultContentEnabledPref'
import {Context} from '#/screens/Onboarding/state'
import {IconCircle} from '#/screens/Onboarding/IconCircle'

export function StepModeration() {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const {data: preferences} = usePreferencesQuery()

  return (
    <View style={[a.align_start, {paddingTop: gtMobile ? 100 : 60}]}>
      <IconCircle icon={EyeSlash} style={[a.mb_2xl]} />

      <Title>
        <Trans>You are in control</Trans>
      </Title>
      <Description style={[a.mb_xl]}>
        <Trans>
          Select the types of content that you want to see (or not see), and
          we'll handle the rest.
        </Trans>
      </Description>

      {!preferences ? (
        <View style={[a.pt_md]}>
          <Loader size="xl" />
        </View>
      ) : (
        <>
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
        </>
      )}

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
