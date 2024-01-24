import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {logger} from '#/logger'
import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
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
  const {_} = useLingui()
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
        <Hashtag size="xl" fill={t.palette.primary_500} />
      </View>

      <Title>
        <Trans>What are your interests?</Trans>
      </Title>
      <Description>
        <Trans>We'll use this to help customize your experience.</Trans>
      </Description>

      <View style={[a.pt_2xl]}>
        <Toggle.Group
          values={interests}
          onChange={setInterests}
          label={_(msg`Select your interests from the options below`)}>
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
          variant="gradient"
          color="gradient_sky"
          size="large"
          label={_(msg`Continue to next step`)}
          onPress={saveInterests}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} position="right" />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
