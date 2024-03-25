import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnalytics} from '#/lib/analytics/analytics'
import {logEvent} from '#/lib/statsig/statsig'
import {capitalize} from '#/lib/strings/capitalize'
import {IS_TEST_USER} from 'lib/constants'
import {useSession} from 'state/session'
import {
  Description,
  OnboardingControls,
  Title,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {FeedCard} from '#/screens/Onboarding/StepAlgoFeeds/FeedCard'
import {aggregateInterestItems} from '#/screens/Onboarding/util'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {IconCircle} from '#/components/IconCircle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded as ListMagnifyingGlass} from '#/components/icons/ListMagnifyingGlass'
import {Loader} from '#/components/Loader'

export function StepTopicalFeeds() {
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {currentAccount} = useSession()
  const {state, dispatch, interestsDisplayNames} = React.useContext(Context)
  const [selectedFeedUris, setSelectedFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const suggestedFeedUris = React.useMemo(() => {
    if (IS_TEST_USER(currentAccount?.handle)) return []
    return aggregateInterestItems(
      state.interestsStepResults.selectedInterests,
      state.interestsStepResults.apiResponse.suggestedFeedUris,
      state.interestsStepResults.apiResponse.suggestedFeedUris.default || [],
    ).slice(0, 10)
  }, [
    currentAccount?.handle,
    state.interestsStepResults.apiResponse.suggestedFeedUris,
    state.interestsStepResults.selectedInterests,
  ])

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
    logEvent('onboarding:topicalFeeds:nextPressed', {
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
