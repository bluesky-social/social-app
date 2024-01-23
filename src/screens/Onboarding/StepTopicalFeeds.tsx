import React from 'react'
import {View} from 'react-native'

import {usePinFeedMutation} from '#/state/queries/preferences'

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

export function StepTopicalFeeds() {
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const [selectedFeedUris, setSelectedFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const {mutateAsync: pinFeed} = usePinFeedMutation()

  const interestsText = React.useMemo(() => {
    const i = state.interestsStepResults.interests
    return i.join(', ')
  }, [state.interestsStepResults.interests])

  const saveFeeds = React.useCallback(async () => {
    setSaving(true)

    for (const uri of selectedFeedUris) {
      try {
        await pinFeed({uri})
      } catch (e) {
        // TODO not critical here?
      }
    }

    setSaving(false)
    dispatch({type: 'next'})
  }, [selectedFeedUris, dispatch, pinFeed])

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
          {state.interestsStepResults.suggestedFeedUris.map(uri => (
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
