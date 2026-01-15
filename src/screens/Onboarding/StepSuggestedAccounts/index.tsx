import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import * as bcp47Match from 'bcp-47-match'

import {wait} from '#/lib/async/wait'
import {popularInterests, useInterestsDisplayNames} from '#/lib/interests'
import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {logger} from '#/logger'
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
import {useSuggestedUsers} from '#/screens/Search/util/useSuggestedUsers'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotate'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {boostInterests, InterestTabs} from '#/components/InterestTabs'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as toast from '#/components/Toast'
import {IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'
import {bulkWriteFollows} from '../util'

export function StepSuggestedAccounts() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const moderationOpts = useModerationOpts()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  const {state, dispatch} = useOnboardingInternalState()

  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  // keeping track of who was followed via the follow all button
  // so we can enable/disable the button without having to dig through the shadow cache
  const [followedUsers, setFollowedUsers] = useState<string[]>([])

  /*
   * Special language handling copied wholesale from the Explore screen
   */
  const {contentLanguages} = useLanguagePrefs()
  const useFullExperience = useMemo(() => {
    if (contentLanguages.length === 0) return true
    return bcp47Match.basicFilter('en', contentLanguages).length > 0
  }, [contentLanguages])
  const interestsDisplayNames = useInterestsDisplayNames()
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(state.interestsStepResults.selectedInterests))
  const {
    data: suggestedUsers,
    isLoading,
    error,
    isRefetching,
    refetch,
  } = useSuggestedUsers({
    category: selectedInterest || (useFullExperience ? null : interests[0]),
    search: !useFullExperience,
    overrideInterests: state.interestsStepResults.selectedInterests,
  })

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
      logger.metric('onboarding:suggestedAccounts:followAllPressed', {
        tab: selectedInterest ?? 'all',
        numAccounts: followableDids.length,
      })
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
        logger.metric(
          'suggestedUser:seen',
          {
            logContext: 'Onboarding',
            recId: undefined,
            position,
            suggestedDid: did,
            category: selectedInterest,
          },
          {statsig: true},
        )
      }
    },
    [selectedInterest],
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

function TabBar({
  selectedInterest,
  onSelectInterest,
  selectedInterests,
  hideDefaultTab,
  defaultTabLabel,
}: {
  selectedInterest: string | null
  onSelectInterest: (interest: string | null) => void
  selectedInterests: string[]
  hideDefaultTab?: boolean
  defaultTabLabel?: string
}) {
  const {_} = useLingui()
  const interestsDisplayNames = useInterestsDisplayNames()
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(selectedInterests))

  return (
    <InterestTabs
      interests={hideDefaultTab ? interests : ['all', ...interests]}
      selectedInterest={
        selectedInterest || (hideDefaultTab ? interests[0] : 'all')
      }
      onSelectTab={tab => {
        logger.metric(
          'onboarding:suggestedAccounts:tabPressed',
          {tab: tab},
          {statsig: true},
        )
        onSelectInterest(tab === 'all' ? null : tab)
      }}
      interestsDisplayNames={
        hideDefaultTab
          ? interestsDisplayNames
          : {
              all: defaultTabLabel || _(msg`For You`),
              ...interestsDisplayNames,
            }
      }
      gutterWidth={IS_WEB ? 0 : tokens.space.xl}
    />
  )
}

function SuggestedProfileCard({
  profile,
  moderationOpts,
  position,
  category,
  onSeen,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  position: number
  category: string | null
  onSeen: (did: string, position: number) => void
}) {
  const t = useTheme()
  const cardRef = useRef<View>(null)
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    const node = cardRef.current
    if (!node || hasTrackedRef.current) return

    if (IS_WEB && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting && !hasTrackedRef.current) {
            hasTrackedRef.current = true
            onSeen(profile.did, position)
            observer.disconnect()
          }
        },
        {threshold: 0.5},
      )
      // @ts-ignore - web only
      observer.observe(node)
      return () => observer.disconnect()
    } else {
      // Native: use a short delay to account for initial layout
      const timeout = setTimeout(() => {
        if (!hasTrackedRef.current) {
          hasTrackedRef.current = true
          onSeen(profile.did, position)
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [onSeen, profile.did, position])

  return (
    <View
      ref={cardRef}
      style={[
        a.w_full,
        a.py_lg,
        a.px_xl,
        position !== 0 && a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <ProfileCard.Outer>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
            disabledPreview
          />
          <ProfileCard.NameAndHandle
            profile={profile}
            moderationOpts={moderationOpts}
          />
          <ProfileCard.FollowButton
            profile={profile}
            moderationOpts={moderationOpts}
            withIcon={false}
            logContext="OnboardingSuggestedAccounts"
            onFollow={() => {
              logger.metric(
                'suggestedUser:follow',
                {
                  logContext: 'Onboarding',
                  location: 'Card',
                  recId: undefined,
                  position,
                  suggestedDid: profile.did,
                  category,
                },
                {statsig: true},
              )
            }}
          />
        </ProfileCard.Header>
        <ProfileCard.Description profile={profile} numberOfLines={3} />
      </ProfileCard.Outer>
    </View>
  )
}
