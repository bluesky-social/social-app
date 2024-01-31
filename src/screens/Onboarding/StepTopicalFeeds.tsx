import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {IS_PROD} from '#/env'
import {atoms as a} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded as ListMagnifyingGlass} from '#/components/icons/ListMagnifyingGlass'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/lib/analytics/analytics'
import {capitalize} from '#/lib/strings/capitalize'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {FeedCard} from '#/screens/Onboarding/StepAlgoFeeds/FeedCard'
import {aggregateInterestItems} from '#/screens/Onboarding/util'
import {IconCircle} from '#/screens/Onboarding/IconCircle'

export function StepTopicalFeeds() {
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {state, dispatch, interestsDisplayNames} = React.useContext(Context)
  const [selectedFeedUris, setSelectedFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const suggestedFeedUris = React.useMemo(() => {
    if (!IS_PROD) return []
    return aggregateInterestItems(
      state.interestsStepResults.selectedInterests,
      state.interestsStepResults.apiResponse.suggestedFeedUris,
      state.interestsStepResults.apiResponse.suggestedFeedUris.default,
    ).slice(0, 10)
  }, [state.interestsStepResults])

  const interestsText = React.useMemo(() => {
    const i = state.interestsStepResults.selectedInterests.map(
      i => interestsDisplayNames[i] || capitalize(i),
    )
    return i.join(', ')
  }, [state.interestsStepResults.selectedInterests, interestsDisplayNames])

  const saveFeeds = React.useCallback(async () => {
    setSaving(true)

    dispatch({type: 'setTopicalFeedsStepResults', feedUris: selectedFeedUris})

    setSaving(false)
    dispatch({type: 'next'})
    track('OnboardingV2:StepTopicalFeeds:End', {
      selectedFeeds: selectedFeedUris,
      selectedFeedsLength: selectedFeedUris.length,
    })
  }, [selectedFeedUris, dispatch, track])

  React.useEffect(() => {
    track('OnboardingV2:StepTopicalFeeds:Start')
  }, [track])

  return (
    <View style={[a.align_start]}>
      <IconCircle icon={ListMagnifyingGlass} style={[a.mb_2xl]} />

      <Title>
        <Trans>Feeds can be topical as well!</Trans>
      </Title>
      <Description>
        {state.interestsStepResults.selectedInterests.length ? (
          <Trans>
            Here are some topical feeds based on your interests: {interestsText}
            . You can choose to follow as many as you like.
          </Trans>
        ) : (
          <Trans>
            Here are some popular topical feeds. You can choose to follow as
            many as you like.
          </Trans>
        )}
      </Description>

      <View style={[a.w_full, a.pb_2xl, a.pt_2xl]}>
        <Toggle.Group
          values={selectedFeedUris}
          onChange={setSelectedFeedUris}
          label={_(msg`Select topical feeds to follow from the list below`)}>
          <View style={[a.gap_md]}>
            {suggestedFeedUris.map(uri => (
              <FeedCard key={uri} config={{default: false, uri}} />
            ))}
          </View>
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label={_(msg`Continue to next step`)}
          onPress={saveFeeds}>
          <ButtonText>
            <Trans>Continue</Trans>
          </ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} position="right" />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
