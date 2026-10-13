import {useCallback, useState} from 'react'
import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

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
import * as Tooltip from '#/components/Tooltip'
import {useAnalytics} from '#/analytics'

export function StepInterests() {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const interestsDisplayNames = useInterestsDisplayNames()

  const {state, dispatch} = useOnboardingInternalState()
  const [saving, setSaving] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    state.interestsStepResults.selectedInterests.map(i => i),
  )
  /*
   * Behind this gate, users must choose at least one interest before they can
   * continue.
   */
  const interestRequired = ax.features.enabled(
    ax.features.OnboardingInterestsRequiredEnable,
  )
  const missingRequiredInterest =
    interestRequired && selectedInterests.length === 0

  const showMissingInterestTooltip = () => {
    ax.metric('onboarding:interests:disabledNextPressed', {})
    setTooltipVisible(true)
  }

  const saveInterests = useCallback(() => {
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
    } catch (error) {
      const e = error as Error
      logger.info(`onboarding: error saving interests`)
      logger.error(e)
    }
  }, [ax, selectedInterests, setSaving, dispatch])

  const continueButton = (
    <Button
      disabled={saving || missingRequiredInterest}
      testID="onboardingContinue"
      variant="solid"
      color="primary"
      size="large"
      label={
        missingRequiredInterest
          ? l`Choose an interest`
          : l`Continue to next step`
      }
      onPress={() => void saveInterests()}>
      <ButtonText style={{pointerEvents: 'none'}}>
        {missingRequiredInterest ? (
          <Trans>Choose an interest</Trans>
        ) : (
          <Trans>Continue</Trans>
        )}
      </ButtonText>
      {saving && <ButtonIcon icon={Loader} />}
    </Button>
  )

  return (
    <View style={[a.align_start, a.gap_sm]} testID="onboardingInterests">
      <OnboardingPosition />
      <OnboardingTitleText>
        <Trans>What are your interests?</Trans>
      </OnboardingTitleText>
      <OnboardingDescriptionText>
        {interestRequired ? (
          <Trans>
            Choose at least one. We'll use this to customize your experience.
            You can change these anytime.
          </Trans>
        ) : (
          <Trans>We'll use this to help customize your experience.</Trans>
        )}
      </OnboardingDescriptionText>

      <View style={[a.w_full, a.pt_lg]}>
        <Toggle.Group
          values={selectedInterests}
          onChange={setSelectedInterests}
          label={l`Select your interests from the options below`}>
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
        <View style={[a.relative]}>
          {missingRequiredInterest ? (
            <Tooltip.Outer
              position="top"
              visible={tooltipVisible}
              onVisibleChange={setTooltipVisible}>
              <Tooltip.Target>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={l`Choose an interest`}
                  accessibilityHint={l`Choose at least one interest to continue`}
                  onPress={showMissingInterestTooltip}>
                  <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants">
                    {continueButton}
                  </View>
                </Pressable>
              </Tooltip.Target>
              <Tooltip.BubbleText label={l`Choose at least one interest.`}>
                <Trans>Choose at least one interest.</Trans>
              </Tooltip.BubbleText>
            </Tooltip.Outer>
          ) : (
            continueButton
          )}
        </View>
      </OnboardingControls.Portal>
    </View>
  )
}
