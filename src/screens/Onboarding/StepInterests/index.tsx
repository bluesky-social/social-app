import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'
import {useQuery} from '@tanstack/react-query'

import {logger} from '#/logger'
import {atoms as a, useBreakpoints} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import * as Toggle from '#/components/forms/Toggle'
import {getAgent} from '#/state/session'
import {useAnalytics} from '#/lib/analytics/analytics'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {
  ApiResponseMap,
  INTEREST_TO_DISPLAY_NAME,
} from '#/screens/Onboarding/StepInterests/data'
import {InterestButton} from '#/screens/Onboarding/StepInterests/InterestButton'
import {IconCircle} from '#/screens/Onboarding/IconCircle'

export function StepInterests() {
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const [saving, setSaving] = React.useState(false)
  const [interests, setInterests] = React.useState<string[]>(
    state.interestsStepResults.selectedInterests.map(i => i),
  )
  const {isLoading, data} = useQuery({
    queryKey: ['interests'],
    queryFn: async () => {
      const {data} = await getAgent().app.bsky.unspecced.getTaggedSuggestions()
      return data.suggestions.reduce(
        (agg, s) => {
          const {tag, subject, subjectType} = s
          const isDefault = tag === 'default'

          if (!agg.interests.includes(tag) && !isDefault) {
            agg.interests.push(tag)
          }

          if (subjectType === 'user') {
            agg.suggestedAccountDids[tag] = agg.suggestedAccountDids[tag] || []
            agg.suggestedAccountDids[tag].push(subject)
          }

          if (subjectType === 'feed') {
            // agg all feeds into defaults
            if (isDefault) {
              agg.suggestedFeedUris[tag] = agg.suggestedFeedUris[tag] || []
            } else {
              agg.suggestedFeedUris[tag] = agg.suggestedFeedUris[tag] || []
              agg.suggestedFeedUris[tag].push(subject)
              agg.suggestedFeedUris.default.push(subject)
            }
          }

          return agg
        },
        {
          interests: [],
          suggestedAccountDids: {},
          suggestedFeedUris: {},
        } as ApiResponseMap,
      )
    },
  })

  const saveInterests = React.useCallback(async () => {
    setSaving(true)

    try {
      setSaving(false)
      dispatch({
        type: 'setInterestsStepResults',
        apiResponse: data!,
        selectedInterests: interests,
      })
      dispatch({type: 'next'})

      track('OnboardingV2:StepInterests:End', {
        selectedInterestsLength: interests.length,
      })
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [interests, data, setSaving, dispatch, track])

  React.useEffect(() => {
    track('OnboardingV2:Begin')
    track('OnboardingV2:StepInterests:Start')
  }, [track])

  return (
    <View style={[a.align_start, {paddingTop: gtMobile ? 100 : 60}]}>
      <IconCircle icon={Hashtag} style={[a.mb_2xl]} />

      <Title>
        <Trans>What are your interests?</Trans>
      </Title>
      <Description>
        <Trans>We'll use this to help customize your experience.</Trans>
      </Description>

      <View style={[a.pt_2xl]}>
        {isLoading || !data ? (
          <Loader size="xl" />
        ) : (
          <Toggle.Group
            values={interests}
            onChange={setInterests}
            label={_(msg`Select your interests from the options below`)}>
            <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
              {data.interests.map(interest => (
                <Toggle.Item
                  key={interest}
                  name={interest}
                  label={INTEREST_TO_DISPLAY_NAME[interest]}>
                  <InterestButton interest={interest} />
                </Toggle.Item>
              ))}
            </View>
          </Toggle.Group>
        )}
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving || !data}
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
