import {useCallback, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import * as bcp47Match from 'bcp-47-match'

import {wait} from '#/lib/async/wait'
import {popularInterests, useInterestsDisplayNames} from '#/lib/interests'
import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useLanguagePrefs} from '#/state/preferences'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent, useSession} from '#/state/session'
import {
  OnboardingControls,
  OnboardingPosition,
  OnboardingTitleText,
} from '#/screens/Onboarding/Layout'
import {useOnboardingInternalState} from '#/screens/Onboarding/state'
import {useSuggestedOnboardingUsers} from '#/screens/Search/util/useSuggestedOnboardingUsers'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotate'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {boostInterests} from '#/components/InterestTabs'
import {Loader} from '#/components/Loader'
import * as toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {bulkWriteFollows} from '../util'
import SuggestedProfileCard from './SuggestedProfileCard'
import TabBar from './TabBar'

export function StepSuggestedAccounts() {
  const {_} = useLingui()
  const ax = useAnalytics()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  const {state, dispatch} = useOnboardingInternalState()

  /*
   * Special language handling copied wholesale from the Explore screen
   */
  const {contentLanguages} = useLanguagePrefs()
  const useFullExperience = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])
  const interestsDisplayNames = useInterestsDisplayNames()
  const selectedInterests = state.interestsStepResults.selectedInterests
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(selectedInterests))

  const {
    data: suggestedUsers,
    isLoading,
    error,
    isRefetching,
    refetch,
  } = useSuggestedOnboardingUsers({
    category: useFullExperience ? null : interests[0],
    search: !useFullExperience,
    overrideInterests: selectedInterests,
  })

  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  // keeping track of who was followed via the follow all button
  // so we can enable/disable the button without having to dig through the shadow cache
  const [followedUsers, setFollowedUsers] = useState<string[]>([])

  const isError = !!error
  const isEmpty =
    !isLoading && suggestedUsers && suggestedUsers.actors.length === 0

  const followableDids =
    suggestedUsers?.actors
      .filter(
        user =>
          user.did !== currentAccount?.did &&
          !isBlockedOrBlocking(user) &&
          !isMuted(user) &&
          !user.viewer?.following &&
          !followedUsers.includes(user.did),
      )
      .map(user => user.did) ?? []

  const {mutate: followAll, isPending: isFollowingAll} = useMutation({
    onMutate: () => {
      ax.metric('onboarding:suggestedAccounts:followAllPressed', {
        tab: selectedInterest ?? 'all',
        numAccounts: followableDids.length,
      })
      for (let i = 0; i < followableDids.length; i++) {
        const did = followableDids[i]
        ax.metric('suggestedUser:follow', {
          logContext: 'Onboarding',
          location: 'FollowAll',
          recId: suggestedUsers?.recId,
          position: i,
          suggestedDid: did,
          category: selectedInterest,
          source: 'SuggestedOnboardingUsers',
        })
      }
    },
    mutationFn: async () => {
      for (const did of followableDids) {
        updateProfileShadow(queryClient, did, {
          followingUri: 'pending',
        })
      }
      const uris = await wait(1e3, bulkWriteFollows(agent, followableDids))
      for (const did of followableDids) {
        const uri = uris.get(did)
        updateProfileShadow(queryClient, did, {
          followingUri: uri,
        })
      }
      return followableDids
    },
    onSuccess: newlyFollowed => {
      toast.show(_(msg`Followed all accounts!`), {type: 'success'})
      setFollowedUsers(followed => [...followed, ...newlyFollowed])
    },
    onError: () => {
      toast.show(
        _(msg`Failed to follow all suggested accounts, please try again`),
        {type: 'error'},
      )
    },
  })

  const canFollowAll = followableDids.length > 0 && !isFollowingAll

  // Track seen profiles - shared ref across all cards
  const seenProfilesRef = useRef<Set<string>>(new Set())
  const onProfileSeen = useCallback(
    (did: string, position: number) => {
      if (!seenProfilesRef.current.has(did)) {
        seenProfilesRef.current.add(did)
        ax.metric('suggestedUser:seen', {
          logContext: 'Onboarding',
          recId: suggestedUsers?.recId,
          position,
          suggestedDid: did,
          category: selectedInterest,
        })
      }
    },
    [ax, selectedInterest, suggestedUsers?.recId],
  )

  return (
    <View style={[a.align_start, a.gap_sm]} testID="onboardingInterests">
      <OnboardingPosition />
      <OnboardingTitleText>
        <Trans comment="Accounts suggested to the user for them to follow">
          Suggested for you
        </Trans>
      </OnboardingTitleText>

      <View
        style={[
          a.overflow_hidden,
          a.mt_sm,
          IS_WEB
            ? [a.max_w_full, web({minHeight: '100vh'})]
            : {marginHorizontal: tokens.space.xl * -1},
          a.flex_1,
          a.justify_start,
        ]}>
        <TabBar
          selectedInterest={selectedInterest}
          onSelectInterest={setSelectedInterest}
          defaultTabLabel={_(
            msg({
              message: 'All',
              comment: 'the default tab in the interests tab bar',
            }),
          )}
          selectedInterests={state.interestsStepResults.selectedInterests}
        />

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
          <View style={[a.flex_1, a.px_xl, a.pt_2xl]}>
            <Admonition type="error">
              <Trans>
                An error occurred while fetching suggested accounts.
              </Trans>
            </Admonition>
          </View>
        ) : isEmpty ? (
          <View style={[a.flex_1, a.px_xl, a.pt_2xl]}>
            <Admonition type="apology">
              <Trans>
                Sorry, we're unable to load account suggestions at this time.
              </Trans>
            </Admonition>
          </View>
        ) : (
          <View
            style={[
              a.flex_1,
              a.mt_md,
              a.border_y,
              t.atoms.border_contrast_low,
              IS_WEB && [a.border_x, a.rounded_sm, a.overflow_hidden],
            ]}>
            {suggestedUsers?.actors.map((user, index) => (
              <SuggestedProfileCard
                key={user.did}
                profile={user}
                moderationOpts={moderationOpts}
                position={index}
                category={selectedInterest}
                onSeen={onProfileSeen}
                recId={suggestedUsers.recId}
              />
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
              onPress={() => void refetch()}>
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
              disabled={!canFollowAll}
              color="secondary"
              size="large"
              label={_(msg`Follow all accounts`)}
              onPress={() => followAll()}>
              <ButtonText>
                <Trans>Follow all</Trans>
              </ButtonText>
              <ButtonIcon icon={isFollowingAll ? Loader : PlusIcon} />
            </Button>
            <Button
              disabled={isFollowingAll}
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
