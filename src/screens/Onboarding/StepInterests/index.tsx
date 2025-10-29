import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {interests, useInterestsDisplayNames} from '#/lib/interests'
import {logEvent} from '#/lib/statsig/statsig'
import {capitalize} from '#/lib/strings/capitalize'
import {logger} from '#/logger'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {InterestButton} from '#/screens/Onboarding/StepInterests/InterestButton'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {IconCircle} from '#/components/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {Loader} from '#/components/Loader'

export function StepInterests() {
  const {_} = useLingui()
  const interestsDisplayNames = useInterestsDisplayNames()

  const {state, dispatch} = React.useContext(Context)
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
      logEvent('onboarding:interests:nextPressed', {
        selectedInterests,
        selectedInterestsLength: selectedInterests.length,
      })
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [selectedInterests, setSaving, dispatch])

  return (
    <View style={[a.align_start]} testID="onboardingInterests">
      <IconCircle icon={Hashtag} style={[a.mb_2xl]} />

      <TitleText>
        <Trans>What are your interests?</Trans>
      </TitleText>
      <DescriptionText>
        <Trans>We'll use this to help customize your experience.</Trans>
      </DescriptionText>

      <View style={[a.w_full, a.pt_2xl]}>
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
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
