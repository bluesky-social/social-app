import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useOnboardingSuggestedStarterPacksQuery} from '#/state/queries/useOnboardingSuggestedStarterPacksQuery'
import {
  OnboardingControls,
  OnboardingPosition,
  OnboardingTitleText,
} from '#/screens/Onboarding/Layout'
import {useOnboardingInternalState} from '#/screens/Onboarding/state'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotate'
import {Loader} from '#/components/Loader'
import {StarterPackCard} from './StarterPackCard'

export function StepSuggestedStarterpacks() {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()

  const {state, dispatch} = useOnboardingInternalState()

  const {
    data: suggestedStarterPacks,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useOnboardingSuggestedStarterPacksQuery({
    enabled: true,
    overrideInterests: state.interestsStepResults.selectedInterests,
  })

  return (
    <View style={[a.align_start, a.gap_sm]} testID="onboardingInterests">
      <OnboardingPosition />
      <OnboardingTitleText>
        <Trans comment="Starter packs suggested to the user for them to follow">
          Find people to follow
        </Trans>
      </OnboardingTitleText>

      <View
        style={[
          a.overflow_hidden,
          a.flex_1,
          a.justify_start,
          a.w_full,
          a.mt_sm,
        ]}>
        {isLoading || !moderationOpts ? (
          <View
            style={[
              a.flex_1,
              a.align_center,
              a.justify_center,
              {minHeight: 400},
            ]}>
            <Loader size="xl" />
          </View>
        ) : isError ? (
          <View style={[a.flex_1, a.px_xl, a.pt_5xl]}>
            <Admonition type="error">
              <Trans>
                An error occurred while fetching suggested accounts.
              </Trans>
            </Admonition>
          </View>
        ) : (
          <View style={[a.flex_1]}>
            {suggestedStarterPacks?.starterPacks.map(starterPack => (
              <View style={[a.pb_lg]} key={starterPack.uri}>
                <StarterPackCard view={starterPack} />
              </View>
            ))}
          </View>
        )}
      </View>

      <OnboardingControls.Portal>
        {isError ? (
          <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
            <Button
              disabled={isRefetching}
              color="secondary"
              size="large"
              label={_(msg`Retry`)}
              onPress={() => refetch()}>
              <ButtonText>
                <Trans>Retry</Trans>
              </ButtonText>
              <ButtonIcon icon={ArrowRotateCounterClockwiseIcon} />
            </Button>
            <Button
              color="secondary"
              size="large"
              label={_(msg`Skip to next step`)}
              onPress={() => dispatch({type: 'next'})}>
              <ButtonText>
                <Trans>Skip</Trans>
              </ButtonText>
            </Button>
          </View>
        ) : (
          <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
            <Button
              color="primary"
              size="large"
              label={_(msg`Continue to next step`)}
              onPress={() => dispatch({type: 'next'})}>
              <ButtonText>
                <Trans>Continue</Trans>
              </ButtonText>
            </Button>
          </View>
        )}
      </OnboardingControls.Portal>
    </View>
  )
}
