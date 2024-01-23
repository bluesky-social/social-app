import React from 'react'
import {View} from 'react-native'

import {atoms as a, useBreakpoints} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {Loader} from '#/components/Loader'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {FeedCard} from '#/screens/Onboarding/StepAlgoFeeds/FeedCard'
import {INTEREST_TO_DISPLAY_NAME} from '#/screens/Onboarding/StepInterests/data'

export function StepTopicalFeeds() {
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const [selectedFeedUris, setSelectedFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  const interestsText = React.useMemo(() => {
    const i = state.interestsStepResults.selectedInterests.map(
      i => INTEREST_TO_DISPLAY_NAME[i],
    )
    return i.join(', ')
  }, [state.interestsStepResults.selectedInterests])

  const saveFeeds = React.useCallback(async () => {
    setSaving(true)

    dispatch({type: 'setTopicalFeedsStepResults', feedUris: selectedFeedUris})

    await new Promise(y => setTimeout(y, 1000))

    setSaving(false)
    dispatch({type: 'next'})
  }, [selectedFeedUris, dispatch])

  return (
    <View style={[a.align_start, {paddingTop: gtMobile ? 100 : 60}]}>
      <Title>Feeds can be topic based as well!</Title>
      <Description>
        Here are some topical feeds based on your interests: {interestsText}
      </Description>

      <Text style={[a.font_bold, a.pt_2xl, a.pb_sm]}>
        Select as many topical feeds as you like:
      </Text>

      <View style={[a.w_full, a.pb_2xl]}>
        <Toggle.Group
          values={selectedFeedUris}
          onChange={setSelectedFeedUris}
          label="Select your primary algorithmic feeds">
          {state.interestsStepResults.apiResponse.feedUris.default.map(uri => (
            <FeedCard key={uri} config={{default: false, uri}} />
          ))}
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={saveFeeds}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
