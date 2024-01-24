import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded as ListMagnifyingGlass} from '#/components/icons/ListMagnifyingGlass'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {FeedCard} from '#/screens/Onboarding/StepAlgoFeeds/FeedCard'
import {INTEREST_TO_DISPLAY_NAME} from '#/screens/Onboarding/StepInterests/data'
import {aggregateInterestItems} from '#/screens/Onboarding/util'

export function StepTopicalFeeds() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const [selectedFeedUris, setSelectedFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const suggestedFeedUris = aggregateInterestItems(
    state.interestsStepResults.selectedInterests,
    state.interestsStepResults.apiResponse.suggestedFeedUris,
    state.interestsStepResults.apiResponse.suggestedFeedUris.default,
  )

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
        <ListMagnifyingGlass size="xl" fill={t.palette.primary_500} />
      </View>

      <Title>
        <Trans>Feeds can be topic based as well!</Trans>
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
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
