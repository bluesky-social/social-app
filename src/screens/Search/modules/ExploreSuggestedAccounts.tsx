import {memo, useEffect} from 'react'
import {View} from 'react-native'
import {type AppBskyActorSearchActors, type ModerationOpts} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type InfiniteData} from '@tanstack/react-query'

import {logger} from '#/logger'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {
  popularInterests,
  useInterestsDisplayNames,
} from '#/screens/Onboarding/state'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import * as ProfileCard from '#/components/ProfileCard'
import {boostInterests, Tabs} from '#/components/ProgressGuide/FollowDialog'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function useLoadEnoughProfiles({
  interest,
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: {
  interest: string | null
  data?: InfiniteData<AppBskyActorSearchActors.OutputSchema>
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}) {
  const profileCount =
    data?.pages.flatMap(page =>
      page.actors.filter(actor => !actor.viewer?.following),
    ).length || 0
  const isAnyLoading = isLoading || isFetchingNextPage
  const isEnoughProfiles = profileCount > 3
  const shouldFetchMore = !isEnoughProfiles && hasNextPage && !!interest
  useEffect(() => {
    if (shouldFetchMore && !isAnyLoading) {
      logger.info('Not enough suggested accounts - fetching more')
      fetchNextPage()
    }
  }, [shouldFetchMore, fetchNextPage, isAnyLoading, interest])

  return {
    isReady: !shouldFetchMore,
  }
}

export function SuggestedAccountsTabBar({
  selectedInterest,
  onSelectInterest,
  hideDefaultTab,
}: {
  selectedInterest: string | null
  onSelectInterest: (interest: string | null) => void
  hideDefaultTab?: boolean
}) {
  const {_} = useLingui()
  const interestsDisplayNames = useInterestsDisplayNames()
  const {data: preferences} = usePreferencesQuery()
  const personalizedInterests = preferences?.interests?.tags
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(personalizedInterests))
  return (
    <BlockDrawerGesture>
      <Tabs
        interests={hideDefaultTab ? interests : ['all', ...interests]}
        selectedInterest={
          selectedInterest || (hideDefaultTab ? interests[0] : 'all')
        }
        onSelectTab={tab => {
          logger.metric(
            'explore:suggestedAccounts:tabPressed',
            {tab: tab},
            {statsig: true},
          )
          onSelectInterest(tab === 'all' ? null : tab)
        }}
        hasSearchText={false}
        interestsDisplayNames={
          hideDefaultTab
            ? interestsDisplayNames
            : {
                all: _(msg`For You`),
                ...interestsDisplayNames,
              }
        }
        TabComponent={Tab}
        contentContainerStyle={[
          {
            // visual alignment
            paddingLeft: a.px_md.paddingLeft,
          },
        ]}
      />
    </BlockDrawerGesture>
  )
}

let Tab = ({
  onSelectTab,
  interest,
  active,
  index,
  interestsDisplayName,
  onLayout,
}: {
  onSelectTab: (index: number) => void
  interest: string
  active: boolean
  index: number
  interestsDisplayName: string
  onLayout: (index: number, x: number, width: number) => void
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const activeText = active ? _(msg` (active)`) : ''
  return (
    <View
      key={interest}
      onLayout={e =>
        onLayout(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width)
      }>
      <Button
        label={_(msg`Search for "${interestsDisplayName}"${activeText}`)}
        onPress={() => onSelectTab(index)}>
        {({hovered, pressed, focused}) => (
          <View
            style={[
              a.rounded_full,
              a.px_lg,
              a.py_sm,
              a.border,
              active || hovered || pressed || focused
                ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_medium]
                : [t.atoms.bg, t.atoms.border_contrast_low],
            ]}>
            <Text
              style={[
                /* TODO: medium weight */
                active || hovered || pressed || focused
                  ? t.atoms.text
                  : t.atoms.text_contrast_medium,
              ]}>
              {interestsDisplayName}
            </Text>
          </View>
        )}
      </Button>
    </View>
  )
}
Tab = memo(Tab)

/**
 * Profile card for suggested accounts. Note: border is on the bottom edge
 */
let SuggestedProfileCard = ({
  profile,
  moderationOpts,
  recId,
  position,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  recId?: number
  position: number
}): React.ReactNode => {
  const t = useTheme()
  return (
    <ProfileCard.Link
      profile={profile}
      style={[a.flex_1]}
      onPress={() => {
        logger.metric(
          'suggestedUser:press',
          {
            logContext: 'Explore',
            recId,
            position,
          },
          {statsig: true},
        )
      }}>
      {s => (
        <>
          <SubtleHover hover={s.hovered || s.pressed} />
          <View
            style={[
              a.flex_1,
              a.w_full,
              a.py_lg,
              a.px_lg,
              a.border_t,
              t.atoms.border_contrast_low,
            ]}>
            <ProfileCard.Outer>
              <ProfileCard.Header>
                <ProfileCard.Avatar
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.NameAndHandle
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.FollowButton
                  profile={profile}
                  moderationOpts={moderationOpts}
                  withIcon={false}
                  logContext="ExploreSuggestedAccounts"
                  onFollow={() => {
                    logger.metric(
                      'suggestedUser:follow',
                      {
                        logContext: 'Explore',
                        location: 'Card',
                        recId,
                        position,
                      },
                      {statsig: true},
                    )
                  }}
                />
              </ProfileCard.Header>
              <ProfileCard.Description profile={profile} numberOfLines={2} />
            </ProfileCard.Outer>
          </View>
        </>
      )}
    </ProfileCard.Link>
  )
}
SuggestedProfileCard = memo(SuggestedProfileCard)
export {SuggestedProfileCard}
