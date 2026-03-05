import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {interests, useInterestsDisplayNames} from '#/lib/interests'
import {capitalize} from '#/lib/strings/capitalize'
import {logger} from '#/logger'
import {
  OnboardingControls,
  OnboardingDescriptionText,
  OnboardingPosition,
  OnboardingTitleText,
} from '#/screens/Onboarding/Layout'
import {useOnboardingInternalState} from '#/screens/Onboarding/state'
import {InterestButton} from '#/screens/Onboarding/StepInterests/InterestButton'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/analytics'

export function StepInterests() {
  const {_} = useLingui()
  const ax = useAnalytics()
  const interestsDisplayNames = useInterestsDisplayNames()

  const {state, dispatch} = useOnboardingInternalState()
  const [saving, setSaving] = React.useState(false)
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(
    state.interestsStepResults.selectedInterests.map(i => i),
  )

  const saveInterests = React.useCallback(async () => {
    setSaving(true)

    try {
      setSaving(false)
      dispatch({
        type: 'setInterestsStepResults',
        selectedInterests,
      })
      dispatch({type: 'next'})
      ax.metric('onboarding:interests:nextPressed', {
        selectedInterests,
        selectedInterestsLength: selectedInterests.length,
      })
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [ax, selectedInterests, setSaving, dispatch])

  return (
    <View style={[a.align_start, a.gap_sm]} testID="onboardingInterests">
      <OnboardingPosition />
      <OnboardingTitleText>
        <Trans>What are your interests?</Trans>
      </OnboardingTitleText>
      <OnboardingDescriptionText>
        <Trans>We'll use this to help customize your experience.</Trans>
      </OnboardingDescriptionText>

      <View style={[a.w_full, a.pt_lg]}>
        <Toggle.Group
          values={selectedInterests}
          onChange={setSelectedInterests}
          label={_(msg`Select your interests from the options below`)}>
          <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
            {interests.map(interest => (
              <Toggle.Item
                key={interest}
                name={interest}
                label={interestsDisplayNames[interest] || capitalize(interest)}>
                <InterestButton interest={interest} />
              </Toggle.Item>
            ))}
          </View>
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving}
          testID="onboardingContinue"
          variant="solid"
          color="primary"
          size="large"
          label={_(msg`Continue to next step`)}
          onPress={saveInterests}>
          <ButtonText>
            <Trans>Continue</Trans>
          </ButtonText>
          {saving && <ButtonIcon icon={Loader} />}
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
