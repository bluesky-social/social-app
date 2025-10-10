import {useCallback, useContext} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useOnboardingSuggestedStarterPacksQuery} from '#/state/queries/useOnboardingSuggestedStarterPacksQuery'
import {useOnboardingDispatch} from '#/state/shell'
import {OnboardingControls} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {StarterPackCard} from './StarterPackCard'

export function StepSuggestedStarterpacks() {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()

  const {state, dispatch} = useContext(Context)
  const onboardDispatch = useOnboardingDispatch()

  const {
    data: suggestedStarterPacks,
    isLoading,
    error,
    isRefetching,
    refetch,
  } = useOnboardingSuggestedStarterPacksQuery({
    enabled: true,
    overrideInterests: state.interestsStepResults.selectedInterests,
  })

  const isError = !!error

  const skipOnboarding = useCallback(() => {
    onboardDispatch({type: 'finish'})
    dispatch({type: 'finish'})
  }, [onboardDispatch, dispatch])

  return (
    <View style={[a.align_start]} testID="onboardingInterests">
      <Text style={[a.font_bold, a.text_3xl]}>
        <Trans comment="Accounts suggested to the user for them to follow">
          Suggested for you
        </Trans>
      </Text>

      <View
        style={[
          a.overflow_hidden,
          a.mt_lg,
          a.flex_1,
          a.justify_start,
          a.w_full,
        ]}>
        {isLoading || !moderationOpts ? (
          <View
            style={[
              a.flex_1,
              a.mt_md,
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
          <View style={[a.flex_1, a.mt_md]}>
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
              label={_(msg`Skip this flow`)}
              onPress={skipOnboarding}>
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
