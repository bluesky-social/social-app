import React from 'react'
import {View} from 'react-native'
import {ScrollView} from 'react-native-gesture-handler'
import {AppBskyFeedDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {NavigationProp} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {useProfilesQuery} from '#/state/queries/profile'
import {useProgressGuide} from '#/state/shell/progress-guide'
import * as userActionHistory from '#/state/userActionHistory'
import {SeenPost} from '#/state/userActionHistory'
import {atoms as a, useBreakpoints, useTheme, ViewStyleProp, web} from '#/alf'
import {Button} from '#/components/Button'
import * as FeedCard from '#/components/FeedCard'
import {ArrowRight_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
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

export function SuggestedFollowPlaceholder() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_sm, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.AvatarPlaceholder />
      </ProfileCard.Header>

      <View style={[a.py_xs]}>
        <ProfileCard.NameAndHandlePlaceholder />
      </View>

      <ProfileCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

export function SuggestedFeedsCardPlaceholder() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_sm, t.atoms.border_contrast_low]}>
      <FeedCard.Header>
        <FeedCard.AvatarPlaceholder />
        <FeedCard.TitleAndBylinePlaceholder creator />
      </FeedCard.Header>

      <FeedCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

function getRank(seenPost: SeenPost): string {
  let tier: string
  if (seenPost.feedContext === 'popfriends') {
    tier = 'a'
  } else if (seenPost.feedContext?.startsWith('cluster')) {
    tier = 'b'
  } else if (seenPost.feedContext?.startsWith('ntpc')) {
    tier = 'c'
  } else if (seenPost.feedContext?.startsWith('t-')) {
    tier = 'd'
  } else if (seenPost.feedContext === 'nettop') {
    tier = 'e'
  } else {
    tier = 'f'
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
  const userActionSnapshot = userActionHistory.useActionHistorySnapshot()
  const dids = React.useMemo(() => {
    const {likes, follows, seen} = userActionSnapshot
    const likeDids = likes
      .map(l => new AtUri(l))
      .map(uri => uri.host)
      .filter(did => !follows.includes(did))
    const seenDids = seen
      .sort(sortSeenPosts)
      .map(l => new AtUri(l.uri))
      .map(uri => uri.host)
    return [...new Set([...likeDids, ...seenDids])]
  }, [userActionSnapshot])
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

export function SuggestedFollows() {
  const t = useTheme()
  const {_} = useLingui()
  const {
    isLoading: isSuggestionsLoading,
    profiles,
    error,
  } = useExperimentalSuggestedUsersQuery()
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
          did={profile.handle}
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
                    color="secondary_inverted"
                    shape="round"
                  />
                </ProfileCard.Header>
                <ProfileCard.Description profile={profile} />
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
      <View style={[a.pt_2xl, a.px_lg, a.flex_row, a.pb_xs]}>
        <Text
          style={[
            a.flex_1,
            a.text_lg,
            a.font_bold,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>Suggested for you</Trans>
        </Text>
        <Person fill={t.atoms.text_contrast_low.color} />
      </View>

      {gtMobile ? (
        <View style={[a.flex_1, a.px_lg, a.pt_md, a.pb_xl, a.gap_md]}>
          <View style={[a.flex_1, a.flex_row, a.flex_wrap, a.gap_md]}>
            {content}
          </View>

          <View
            style={[
              a.flex_row,
              a.justify_end,
              a.align_center,
              a.pt_xs,
              a.gap_md,
            ]}>
            <InlineLinkText to="/search" style={[t.atoms.text_contrast_medium]}>
              <Trans>Browse more suggestions</Trans>
            </InlineLinkText>
            <Arrow size="sm" fill={t.atoms.text_contrast_medium.color} />
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={MOBILE_CARD_WIDTH + a.gap_md.gap}
          decelerationRate="fast">
          <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
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
                      <Trans>Browse more suggestions on the Explore page</Trans>
                    </Text>

                    <Arrow size="xl" />
                  </View>
                </View>
              </CardOuter>
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

export function SuggestedFeeds() {
  const numFeedsToDisplay = 3
  const t = useTheme()
  const {_} = useLingui()
  const {data, isLoading, error} = useGetPopularFeedsQuery({
    limit: numFeedsToDisplay,
  })
  const navigation = useNavigation<NavigationProp>()
  const {gtMobile} = useBreakpoints()

  const feeds = React.useMemo(() => {
    const items: AppBskyFeedDefs.GeneratorView[] = []

    if (!data) return items

    for (const page of data.pages) {
      for (const feed of page.feeds) {
        items.push(feed)
      }
    }

    return items
  }, [data])

  const content = isLoading ? (
    Array(numFeedsToDisplay)
      .fill(0)
      .map((_, i) => <SuggestedFeedsCardPlaceholder key={i} />)
  ) : error || !feeds ? null : (
    <>
      {feeds.slice(0, numFeedsToDisplay).map(feed => (
        <FeedCard.Link
          key={feed.uri}
          view={feed}
          onPress={() => {
            logEvent('feed:interstitial:feedCard:press', {})
          }}>
          {({hovered, pressed}) => (
            <CardOuter
              style={[
                a.flex_1,
                (hovered || pressed) && t.atoms.border_contrast_high,
              ]}>
              <FeedCard.Outer>
                <FeedCard.Header>
                  <FeedCard.Avatar src={feed.avatar} />
                  <FeedCard.TitleAndByline
                    title={feed.displayName}
                    creator={feed.creator}
                  />
                </FeedCard.Header>
                <FeedCard.Description
                  description={feed.description}
                  numberOfLines={3}
                />
              </FeedCard.Outer>
            </CardOuter>
          )}
        </FeedCard.Link>
      ))}
    </>
  )

  return error ? null : (
    <View
      style={[a.border_t, t.atoms.border_contrast_low, t.atoms.bg_contrast_25]}>
      <View style={[a.pt_2xl, a.px_lg, a.flex_row, a.pb_xs]}>
        <Text
          style={[
            a.flex_1,
            a.text_lg,
            a.font_bold,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>Some other feeds you might like</Trans>
        </Text>
        <Hashtag fill={t.atoms.text_contrast_low.color} />
      </View>

      {gtMobile ? (
        <View style={[a.flex_1, a.px_lg, a.pt_md, a.pb_xl, a.gap_md]}>
          {content}

          <View
            style={[
              a.flex_row,
              a.justify_end,
              a.align_center,
              a.pt_xs,
              a.gap_md,
            ]}>
            <InlineLinkText to="/search" style={[t.atoms.text_contrast_medium]}>
              <Trans>Browse more suggestions</Trans>
            </InlineLinkText>
            <Arrow size="sm" fill={t.atoms.text_contrast_medium.color} />
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={MOBILE_CARD_WIDTH + a.gap_md.gap}
          decelerationRate="fast">
          <View style={[a.px_lg, a.pt_md, a.pb_xl, a.flex_row, a.gap_md]}>
            {content}

            <Button
              label={_(msg`Browse more feeds on the Explore page`)}
              onPress={() => {
                navigation.navigate('SearchTab')
              }}
              style={[a.flex_col]}>
              <CardOuter style={[a.flex_1]}>
                <View style={[a.flex_1, a.justify_center]}>
                  <View style={[a.flex_row, a.px_lg]}>
                    <Text style={[a.pr_xl, a.flex_1, a.leading_snug]}>
                      <Trans>Browse more suggestions on the Explore page</Trans>
                    </Text>

                    <Arrow size="xl" />
                  </View>
                </View>
              </CardOuter>
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

export function ProgressGuide() {
  const t = useTheme()
  const {isDesktop} = useWebMediaQueries()
  const guide = useProgressGuide('like-10-and-follow-7')

  if (isDesktop) {
    return null
  }

  return guide ? (
    <View
      style={[
        a.border_t,
        t.atoms.border_contrast_low,
        a.px_lg,
        a.py_lg,
        a.pb_lg,
      ]}>
      <ProgressGuideList />
    </View>
  ) : null
}
