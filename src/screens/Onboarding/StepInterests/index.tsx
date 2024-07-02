import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {useAnalytics} from '#/lib/analytics/analytics'
import {logEvent} from '#/lib/statsig/statsig'
import {useGate} from '#/lib/statsig/statsig'
import {capitalize} from '#/lib/strings/capitalize'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useAgent} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {
  ApiResponseMap,
  Context,
  useInterestsDisplayNames,
} from '#/screens/Onboarding/state'
import {InterestButton} from '#/screens/Onboarding/StepInterests/InterestButton'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {IconCircle} from '#/components/IconCircle'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwise} from '#/components/icons/ArrowRotateCounterClockwise'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {EmojiSad_Stroke2_Corner0_Rounded as EmojiSad} from '#/components/icons/Emoji'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const PROMPT_HEIGHT = isWeb ? 42 : 36
// matches the padding of the OnboardingControls.Portal
const PROMPT_OFFSET = isWeb ? a.pb_2xl.paddingBottom : a.pb_lg.paddingBottom
const MIN_INTERESTS = 3

export function StepInterests() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {track} = useAnalytics()
  const gate = useGate()
  const interestsDisplayNames = useInterestsDisplayNames()

  const {state, dispatch} = React.useContext(Context)
  const [saving, setSaving] = React.useState(false)
  const [interests, setInterests] = React.useState<string[]>(
    state.interestsStepResults.selectedInterests.map(i => i),
  )
  const onboardDispatch = useOnboardingDispatch()
  const agent = useAgent()
  const {isLoading, isError, error, data, refetch, isFetching} = useQuery({
    queryKey: ['interests'],
    queryFn: async () => {
      try {
        const {data} = await agent.app.bsky.unspecced.getTaggedSuggestions()
        return data.suggestions.reduce(
          (agg, s) => {
            const {tag, subject, subjectType} = s
            const isDefault = tag === 'default'

            if (!agg.interests.includes(tag) && !isDefault) {
              agg.interests.push(tag)
            }

            if (subjectType === 'user') {
              agg.suggestedAccountDids[tag] =
                agg.suggestedAccountDids[tag] || []
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
      } catch (e: any) {
        logger.info(
          `onboarding: getTaggedSuggestions fetch or processing failed`,
        )
        logger.error(e)
        track('OnboardingV2:StepInterests:Error')

        throw new Error(`a network error occurred`)
      }
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
        selectedInterests: interests,
        selectedInterestsLength: interests.length,
      })
      logEvent('onboarding:interests:nextPressed', {
        selectedInterests: interests,
        selectedInterestsLength: interests.length,
      })
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [interests, data, setSaving, dispatch, track])

  const skipOnboarding = React.useCallback(() => {
    onboardDispatch({type: 'finish'})
    dispatch({type: 'finish'})
    track('OnboardingV2:Skip')
  }, [onboardDispatch, dispatch, track])

  React.useEffect(() => {
    track('OnboardingV2:Begin')
    track('OnboardingV2:StepInterests:Start')
  }, [track])

  const isMinimumInterestsEnabled = gate('onboarding_minimum_interests')
  const meetsMinimumRequirement = isMinimumInterestsEnabled
    ? interests.length >= MIN_INTERESTS
    : true

  const title = isError ? (
    <Trans>Oh no! Something went wrong.</Trans>
  ) : (
    <Trans>What are your interests?</Trans>
  )
  const description = isError ? (
    <Trans>
      We weren't able to connect. Please try again to continue setting up your
      account. If it continues to fail, you can skip this flow.
    </Trans>
  ) : (
    <Trans>We'll use this to help customize your experience.</Trans>
  )

  return (
    <View style={[a.align_start]} testID="onboardingInterests">
      <IconCircle
        icon={isError ? EmojiSad : Hashtag}
        style={[
          a.mb_2xl,
          isError
            ? {
                backgroundColor: t.palette.negative_50,
              }
            : {},
        ]}
        iconStyle={[
          isError
            ? {
                color: t.palette.negative_900,
              }
            : {},
        ]}
      />

      <TitleText>{title}</TitleText>
      <DescriptionText>{description}</DescriptionText>
      {isMinimumInterestsEnabled && (
        <DescriptionText style={[a.pt_sm]}>
          <Trans>Choose 3 or more:</Trans>
        </DescriptionText>
      )}

      <View style={[a.w_full, isMinimumInterestsEnabled ? a.pt_md : a.pt_2xl]}>
        {isLoading ? (
          <Loader size="xl" />
        ) : isError || !data ? (
          <View
            style={[
              a.w_full,
              a.p_lg,
              a.rounded_md,
              {
                backgroundColor: t.palette.negative_50,
              },
            ]}>
            <Text style={[a.text_md]}>
              <Text
                style={[
                  a.text_md,
                  a.font_bold,
                  {
                    color: t.palette.negative_900,
                  },
                ]}>
                <Trans>Error:</Trans>{' '}
              </Text>
              {error?.message || _(msg`an unknown error occurred`)}
            </Text>
          </View>
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
                  label={
                    interestsDisplayNames[interest] || capitalize(interest)
                  }>
                  <InterestButton interest={interest} />
                </Toggle.Item>
              ))}
            </View>
          </Toggle.Group>
        )}
      </View>

      <OnboardingControls.Portal>
        {isError ? (
          <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
            <Button
              disabled={isFetching}
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Retry`)}
              onPress={() => refetch()}>
              <ButtonText>
                <Trans>Retry</Trans>
              </ButtonText>
              <ButtonIcon icon={ArrowRotateCounterClockwise} position="right" />
            </Button>
            <Button
              variant="outline"
              color="secondary"
              size="large"
              label={_(msg`Skip this flow`)}
              onPress={skipOnboarding}>
              <ButtonText>
                <Trans>Skip</Trans>
              </ButtonText>
            </Button>
          </View>
        ) : (
          <Button
            disabled={saving || !data || !meetsMinimumRequirement}
            variant="gradient"
            color="gradient_sky"
            size="large"
            label={_(msg`Continue to next step`)}
            onPress={saveInterests}>
            <ButtonText>
              <Trans>Continue</Trans>
            </ButtonText>
            <ButtonIcon
              icon={saving ? Loader : ChevronRight}
              position="right"
            />
          </Button>
        )}

        {!meetsMinimumRequirement && (
          <View
            style={[
              a.align_center,
              a.absolute,
              {
                top: 0,
                left: 0,
                right: 0,
                margin: 'auto',
                transform: [
                  {
                    translateY:
                      -1 *
                      (PROMPT_OFFSET + PROMPT_HEIGHT + a.pb_lg.paddingBottom),
                  },
                ],
              },
            ]}>
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_sm,
                a.rounded_full,
                a.border,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_medium,
                {
                  height: PROMPT_HEIGHT,
                  ...t.atoms.shadow_sm,
                  shadowOpacity: 0.1,
                },
                isWeb
                  ? [a.py_md, a.px_lg, a.pr_xl]
                  : [a.py_sm, a.px_md, a.pr_lg],
              ]}>
              <CircleInfo />
              <Text>
                <Trans>
                  Choose at least {MIN_INTERESTS - interests.length} more
                </Trans>
              </Text>
            </View>
          </View>
        )}
      </OnboardingControls.Portal>
    </View>
  )
}
