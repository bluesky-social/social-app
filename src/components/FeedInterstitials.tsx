import React from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyActorDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {useProfilesQuery} from '#/state/queries/profile'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {useSession} from '#/state/session'
import * as userActionHistory from '#/state/userActionHistory'
import {SeenPost} from '#/state/userActionHistory'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useBreakpoints, useTheme, ViewStyleProp, web} from '#/alf'
import {Button} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ArrowRight_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {PersonPlus_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {InlineLinkText} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {ProgressGuideList} from './ProgressGuide/List'

const MOBILE_CARD_WIDTH = 300

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        !gtMobile && {
          width: MOBILE_CARD_WIDTH,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

function SuggestedFollowPlaceholder() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_md, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.AvatarPlaceholder />
        <ProfileCard.NameAndHandlePlaceholder />
      </ProfileCard.Header>

      <ProfileCard.DescriptionPlaceholder numberOfLines={2} />
    </CardOuter>
  )
}

function getRank(seenPost: SeenPost): string {
  let tier: string
  if (seenPost.feedContext === 'popfriends') {
    tier = 'a'
  } else if (seenPost.feedContext?.startsWith('cluster')) {
    tier = 'b'
  } else if (seenPost.feedContext === 'popcluster') {
    tier = 'c'
  } else if (seenPost.feedContext?.startsWith('ntpc')) {
    tier = 'd'
  } else if (seenPost.feedContext?.startsWith('t-')) {
    tier = 'e'
  } else if (seenPost.feedContext === 'nettop') {
    tier = 'f'
  } else {
    tier = 'g'
  }
  let score = Math.round(
    Math.log(
      1 + seenPost.likeCount + seenPost.repostCount + seenPost.replyCount,
    ),
  )
  if (seenPost.isFollowedBy || Math.random() > 0.9) {
    score *= 2
  }
  const rank = 100 - score
  return `${tier}-${rank}`
}

function sortSeenPosts(postA: SeenPost, postB: SeenPost): 0 | 1 | -1 {
  const rankA = getRank(postA)
  const rankB = getRank(postB)
  // Yes, we're comparing strings here.
  // The "larger" string means a worse rank.
  if (rankA > rankB) {
    return 1
  } else if (rankA < rankB) {
    return -1
  } else {
    return 0
  }
}

function useExperimentalSuggestedUsersQuery() {
  const {currentAccount} = useSession()
  const userActionSnapshot = userActionHistory.useActionHistorySnapshot()
  const dids = React.useMemo(() => {
    const {likes, follows, followSuggestions, seen} = userActionSnapshot
    const likeDids = likes
      .map(l => new AtUri(l))
      .map(uri => uri.host)
      .filter(did => !follows.includes(did))
    let suggestedDids: string[] = []
    if (followSuggestions.length > 0) {
      suggestedDids = [
        // It's ok if these will pick the same item (weighed by its frequency)
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
        followSuggestions[Math.floor(Math.random() * followSuggestions.length)],
      ]
    }
    const seenDids = seen
      .sort(sortSeenPosts)
      .map(l => new AtUri(l.uri))
      .map(uri => uri.host)
    return [...new Set([...suggestedDids, ...likeDids, ...seenDids])].filter(
      did => did !== currentAccount?.did,
    )
  }, [userActionSnapshot, currentAccount])
  const {data, isLoading, error} = useProfilesQuery({
    handles: dids.slice(0, 16),
  })

  const profiles = data
    ? data.profiles.filter(profile => {
        return !profile.viewer?.following
      })
    : []

  return {
    isLoading,
    error,
    profiles: profiles.slice(0, 6),
  }
}

export function SuggestedFollows({feed}: {feed: FeedDescriptor}) {
  const {currentAccount} = useSession()
  const [feedType, feedUriOrDid] = feed.split('|')
  if (feedType === 'author') {
    if (currentAccount?.did === feedUriOrDid) {
      return null
    } else {
      return <SuggestedFollowsProfile did={feedUriOrDid} />
    }
  } else {
    return <SuggestedFollowsHome />
  }
}

function SuggestedFollowsProfile({did}: {did: string}) {
  const {
    isLoading: isSuggestionsLoading,
    data,
    error,
  } = useSuggestedFollowsByActorQuery({
    did,
  })
  return (
    <ProfileGrid
      isSuggestionsLoading={isSuggestionsLoading}
      profiles={data?.suggestions ?? []}
      error={error}
      viewContext="profile"
    />
  )
}

function SuggestedFollowsHome() {
  const {
    isLoading: isSuggestionsLoading,
    profiles,
    error,
  } = useExperimentalSuggestedUsersQuery()
  return (
    <ProfileGrid
      isSuggestionsLoading={isSuggestionsLoading}
      profiles={profiles}
      error={error}
      viewContext="feed"
    />
  )
}

function ProfileGrid({
  isSuggestionsLoading,
  error,
  profiles,
  viewContext = 'feed',
}: {
  isSuggestionsLoading: boolean
  profiles: AppBskyActorDefs.ProfileViewDetailed[]
  error: Error | null
  viewContext: 'profile' | 'feed'
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()
  const isLoading = isSuggestionsLoading || !moderationOpts
  const maxLength = gtMobile ? 4 : 6

  const content = isLoading ? (
    Array(maxLength)
      .fill(0)
      .map((_, i) => (
        <View
          key={i}
          style={[gtMobile && web([a.flex_0, {width: 'calc(50% - 6px)'}])]}>
          <SuggestedFollowPlaceholder />
        </View>
      ))
  ) : error || !profiles.length ? null : (
    <>
      {profiles.slice(0, maxLength).map(profile => (
        <ProfileCard.Link
          key={profile.did}
          profile={profile}
          onPress={() => {
            logEvent('feed:interstitial:profileCard:press', {})
          }}
          style={[
            a.flex_1,
            gtMobile && web([a.flex_0, {width: 'calc(50% - 6px)'}]),
          ]}>
          {({hovered, pressed}) => (
            <CardOuter
              style={[
                a.flex_1,
                (hovered || pressed) && t.atoms.border_contrast_high,
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
                    logContext="FeedInterstitial"
                    shape="round"
                    colorInverted
                  />
                </ProfileCard.Header>
                <ProfileCard.Description profile={profile} numberOfLines={2} />
              </ProfileCard.Outer>
            </CardOuter>
          )}
        </ProfileCard.Link>
      ))}
    </>
  )

  if (error || (!isLoading && profiles.length < 4)) {
    logger.debug(`Not enough profiles to show suggested follows`)
    return null
  }

  return (
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      <View
        style={[
          a.p_lg,
          a.pb_xs,
          a.flex_row,
          a.align_center,
          a.justify_between,
        ]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
          {viewContext === 'profile' ? (
            <Trans>Similar accounts</Trans>
          ) : (
            <Trans>Suggested for you</Trans>
          )}
        </Text>
        <Person fill={t.atoms.text_contrast_low.color} size="sm" />
      </View>

      {gtMobile ? (
        <View style={[a.flex_1, a.px_lg, a.pt_sm, a.pb_lg, a.gap_md]}>
          <View style={[a.flex_1, a.flex_row, a.flex_wrap, a.gap_sm]}>
            {content}
          </View>

          <View style={[a.flex_row, a.justify_end, a.align_center, a.gap_md]}>
            <InlineLinkText
              label={_(msg`Browse more suggestions`)}
              to="/search"
              style={[t.atoms.text_contrast_medium]}>
              <Trans>Browse more suggestions</Trans>
            </InlineLinkText>
            <Arrow size="sm" fill={t.atoms.text_contrast_medium.color} />
          </View>
        </View>
      ) : (
        <BlockDrawerGesture>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={MOBILE_CARD_WIDTH + a.gap_md.gap}
            decelerationRate="fast">
            <View style={[a.px_lg, a.pt_sm, a.pb_lg, a.flex_row, a.gap_md]}>
              {content}

              <Button
                label={_(msg`Browse more accounts on the Explore page`)}
                onPress={() => {
                  navigation.navigate('SearchTab')
                }}>
                <CardOuter style={[a.flex_1, {borderWidth: 0}]}>
                  <View style={[a.flex_1, a.justify_center]}>
                    <View style={[a.flex_row, a.px_lg]}>
                      <Text style={[a.pr_xl, a.flex_1, a.leading_snug]}>
                        <Trans>
                          Browse more suggestions on the Explore page
                        </Trans>
                      </Text>

                      <Arrow size="xl" />
                    </View>
                  </View>
                </CardOuter>
              </Button>
            </View>
          </ScrollView>
        </BlockDrawerGesture>
      )}
    </View>
  )
}

export function ProgressGuide() {
  const t = useTheme()
  return (
    <View style={[t.atoms.border_contrast_low, a.px_lg, a.py_lg, a.pb_lg]}>
      <ProgressGuideList />
    </View>
  )
}
