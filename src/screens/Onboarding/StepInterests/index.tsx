import React from 'react'
import {View} from 'react-native'

import {logger} from '#/logger'
import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import * as Toggle from '#/components/forms/Toggle'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {
  API_RESPONSE,
  INTEREST_TO_DISPLAY_NAME,
} from '#/screens/Onboarding/StepInterests/data'
import {InterestButton} from '#/screens/Onboarding/StepInterests/InterestButton'

export function StepInterests() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const [saving, setSaving] = React.useState(false)
  const [interests, setInterests] = React.useState<string[]>(
    state.interestsStepResults.selectedInterests.map(i => i),
  )

  const saveInterests = React.useCallback(async () => {
    setSaving(true)

    try {
      // TODO get response

      // done
      setSaving(false)
      dispatch({
        type: 'setInterestsStepResults',
        apiResponse: API_RESPONSE,
        selectedInterests: interests,
      })
      dispatch({type: 'next'})
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [interests, setSaving, dispatch])

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
        <At size="xl" fill={t.palette.primary_500} />
      </View>

      <Title>What are your interests?</Title>
      <Description>
        We'll use this to help customize your experience. Select at least 3
        interests.
      </Description>

      <View style={[a.pt_2xl]}>
        <Toggle.Group
          values={interests}
          onChange={setInterests}
          label="Select your interests">
          <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
            {API_RESPONSE.interests.map(interest => (
              <Toggle.Item
                key={interest}
                name={interest}
                label={INTEREST_TO_DISPLAY_NAME[interest]}>
                <InterestButton interest={interest} />
              </Toggle.Item>
            ))}
          </View>
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving}
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={saveInterests}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
