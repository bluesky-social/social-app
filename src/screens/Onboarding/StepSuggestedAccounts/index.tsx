import {useCallback, useContext, useMemo, useState} from 'react'
import {View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import * as bcp47Match from 'bcp-47-match'

import {wait} from '#/lib/async/wait'
import {isBlockedOrBlocking, isMuted} from '#/lib/moderation/blocked-and-muted'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useLanguagePrefs} from '#/state/preferences'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAgent, useSession} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {OnboardingControls} from '#/screens/Onboarding/Layout'
import {
  Context,
  popularInterests,
  useInterestsDisplayNames,
} from '#/screens/Onboarding/state'
import {useSuggestedUsers} from '#/screens/Search/util/useSuggestedUsers'
import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon} from '#/components/icons/ArrowRotateCounterClockwise'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {boostInterests, InterestTabs} from '#/components/InterestTabs'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'
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

  const {state, dispatch} = useContext(Context)
  const onboardDispatch = useOnboardingDispatch()

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

  const skipOnboarding = useCallback(() => {
    onboardDispatch({type: 'finish'})
    dispatch({type: 'finish'})
  }, [onboardDispatch, dispatch])

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
          isWeb ? a.max_w_full : {marginHorizontal: tokens.space.xl * -1},
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
          <View style={[a.flex_1, a.px_xl, a.pt_5xl]}>
            <Admonition type="error">
              <Trans>
                An error occurred while fetching suggested accounts.
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
              isWeb && [a.border_x, a.rounded_sm, a.overflow_hidden],
            ]}>
            {suggestedUsers?.actors.map((user, index) => (
              <SuggestedProfileCard
                key={user.did}
                profile={user}
                moderationOpts={moderationOpts}
                position={index}
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
      gutterWidth={isWeb ? 0 : tokens.space.xl}
    />
  )
}

function SuggestedProfileCard({
  profile,
  moderationOpts,
  position,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  position: number
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
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
