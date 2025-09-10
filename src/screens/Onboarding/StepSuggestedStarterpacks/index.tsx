import {useCallback, useContext} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSuggestedStarterPacksQuery} from '#/state/queries/useSuggestedStarterPacksQuery'
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

  /*
   * Special language handling copied wholesale from the Explore screen
   */
  // const {contentLanguages} = useLanguagePrefs()
  // const useFullExperience = useMemo(() => {
  //   if (contentLanguages.length === 0) return true
  //   return bcp47Match.basicFilter('en', contentLanguages).length > 0
  // }, [contentLanguages])

  const {
    data: suggestedUsers,
    isLoading,
    error,
    isRefetching,
    refetch,
  } = useSuggestedStarterPacksQuery({
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
      <Text style={[a.font_heavy, a.text_3xl]}>
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
        {/*<TabBar
          selectedInterest={selectedInterest}
          onSelectInterest={setSelectedInterest}
          defaultTabLabel={_(
            msg({
              message: 'All',
              comment: 'the default tab in the interests tab bar',
            }),
          )}
          selectedInterests={state.interestsStepResults.selectedInterests}
        />*/}

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
            {suggestedUsers?.starterPacks.map(starterPack => (
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

// function TabBar({
//   selectedInterest,
//   onSelectInterest,
//   selectedInterests,
//   hideDefaultTab,
//   defaultTabLabel,
// }: {
//   selectedInterest: string | null
//   onSelectInterest: (interest: string | null) => void
//   selectedInterests: string[]
//   hideDefaultTab?: boolean
//   defaultTabLabel?: string
// }) {
//   const {_} = useLingui()
//   const interestsDisplayNames = useInterestsDisplayNames()
//   const interests = Object.keys(interestsDisplayNames)
//     .sort(boostInterests(popularInterests))
//     .sort(boostInterests(selectedInterests))

//   return (
//     <InterestTabs
//       interests={hideDefaultTab ? interests : ['all', ...interests]}
//       selectedInterest={
//         selectedInterest || (hideDefaultTab ? interests[0] : 'all')
//       }
//       onSelectTab={tab => {
//         logger.metric(
//           'onboarding:suggestedAccounts:tabPressed',
//           {tab: tab},
//           {statsig: true},
//         )
//         onSelectInterest(tab === 'all' ? null : tab)
//       }}
//       interestsDisplayNames={
//         hideDefaultTab
//           ? interestsDisplayNames
//           : {
//               all: defaultTabLabel || _(msg`For You`),
//               ...interestsDisplayNames,
//             }
//       }
//       gutterWidth={isWeb ? 0 : tokens.space.xl}
//     />
//   )
// }
