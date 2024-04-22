import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {useGate} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useGetPopularFeedsQuery} from '#/state/queries/feed'
import {
  useGetSuggestedFollowersByActor,
  useSuggestedFollowsQuery,
} from '#/state/queries/suggested-follows'
import {useSession} from '#/state/session'
import {cleanError} from 'lib/strings/errors'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {List} from 'view/com/util/List'
import {
  FeedFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from 'view/com/util/LoadingPlaceholder'
import {Text} from 'view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {IconCircle} from '#/components/IconCircle'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded} from '#/components/icons/ListMagnifyingGlass'
import {Person_Stroke2_Corner0_Rounded} from '#/components/icons/Person'

type FlatlistItem =
  | {
      type: 'error'
      key: string
      error: string
    }
  | {type: 'suggestedFollowsHeader'; key: string}
  | {type: 'suggestedFollowsLoading'; key: string}
  | {
      type: 'suggestedFollow'
      key: string
      profile: AppBskyActorDefs.ProfileViewBasic
    }
  | {
      type: 'popularFeedsHeader'
      key: string
    }
  | {
      type: 'popularFeedsLoading'
      key: string
    }
  | {
      type: 'popularFeedsNoResults'
      key: string
    }
  | {
      type: 'popularFeed'
      key: string
      feedUri: string
    }

// HACK
// the protocol doesn't yet tell us which feeds are personalized
// this list is used to filter out feed recommendations from logged out users
// for the ones we know need it
// -prf
const KNOWN_AUTHED_ONLY_FEEDS = [
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends', // popular with friends, by bsky.app
  'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals', // mutuals, by skyfeed
  'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/only-posts', // only posts, by skyfeed
  'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions', // mentions, by flicknow
  'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/bangers', // my bangers, by jaz
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals', // mutuals, by bluesky
  'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/my-followers', // followers, by jaz
  'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/followpics', // the gram, by why
]

export function Suggestions() {
  const gate = useGate()
  const useSuggestedFollows = gate('use_new_suggestions_endpoint')
    ? // Conditional hook call here is *only* OK because useGate()
      // result won't change until a remount.
      useSuggestedFollowsV2
    : useSuggestedFollowsV1

  const [isPTR, setIsPTR] = React.useState(false)

  const {
    data: popularFeeds,
    isFetching: isPopularFeedsFetching,
    error: popularFeedsError,
    refetch: refetchPopularFeeds,
  } = useGetPopularFeedsQuery()
  const [suggestedFollows, refetchSuggestedFollows] = useSuggestedFollows()
  const {hasSession} = useSession()

  /**
   * A search query is present. We may not have search results yet.
   */
  const onPullToRefresh = React.useCallback(async () => {
    setIsPTR(true)
    await Promise.all([
      refetchPopularFeeds().catch(_e => undefined),
      refetchSuggestedFollows().catch(_e => undefined),
    ])
    setIsPTR(false)
  }, [setIsPTR, refetchPopularFeeds, refetchSuggestedFollows])

  const items = React.useMemo(() => {
    let items: FlatlistItem[] = []

    items.push({
      key: 'suggestedFollowsHeader',
      type: 'suggestedFollowsHeader',
    })
    if (!suggestedFollows.length) {
      items.push({
        key: 'suggestedFollowsLoading',
        type: 'suggestedFollowsLoading',
      })
    } else {
      items = items.concat(
        suggestedFollows.map(follow => ({
          key: `suggestedFollow:${follow.did}`,
          type: 'suggestedFollow',
          profile: follow,
        })),
      )
    }

    items.push({
      key: 'popularFeedsHeader',
      type: 'popularFeedsHeader',
    })

    if (popularFeedsError) {
      items.push({
        key: 'popularFeedsError',
        type: 'error',
        error: cleanError(popularFeedsError?.toString()),
      })
    } else {
      if (isPopularFeedsFetching && !popularFeeds?.pages) {
        items.push({
          key: 'popularFeedsLoading',
          type: 'popularFeedsLoading',
        })
      } else {
        if (
          !popularFeeds?.pages ||
          popularFeeds?.pages[0]?.feeds?.length === 0
        ) {
          items.push({
            key: 'popularFeedsNoResults',
            type: 'popularFeedsNoResults',
          })
        } else {
          for (const page of popularFeeds.pages || []) {
            items = items.concat(
              page.feeds
                .filter(feed => {
                  if (
                    !hasSession &&
                    KNOWN_AUTHED_ONLY_FEEDS.includes(feed.uri)
                  ) {
                    return false
                  }
                  return true
                })
                .map(feed => ({
                  key: `popularFeed:${feed.uri}`,
                  type: 'popularFeed',
                  feedUri: feed.uri,
                })),
            )
          }
        }
      }
    }

    return items
  }, [
    hasSession,
    suggestedFollows,
    popularFeeds,
    isPopularFeedsFetching,
    popularFeedsError,
  ])

  const renderItem = React.useCallback(
    ({item}: {item: FlatlistItem}) => {
      if (item.type === 'error') {
        return <ErrorMessage message={item.error} />
      } else if (item.type === 'suggestedFollowsHeader') {
        return <SuggestedFollowsHeader />
      } else if (item.type === 'suggestedFollowsLoading') {
        return <ProfileCardFeedLoadingPlaceholder />
      } else if (item.type === 'suggestedFollow') {
        return <ProfileCardWithFollowBtn profile={item.profile} noBg />
      } else if (item.type === 'popularFeedsHeader') {
        return <SuggestedFeedsHeader />
      } else if (item.type === 'popularFeedsLoading') {
        return <FeedFeedLoadingPlaceholder />
      } else if (item.type === 'popularFeed') {
        return (
          <FeedSourceCard
            feedUri={item.feedUri}
            showSaveBtn={hasSession}
            showDescription
            showLikes
            pinOnSave
          />
        )
      }
      return null
    },
    [hasSession],
  )

  return (
    <List
      data={items}
      keyExtractor={item => item.key}
      contentContainerStyle={{paddingBottom: 200}}
      renderItem={renderItem}
      refreshing={isPTR}
      onRefresh={onPullToRefresh}
      initialNumToRender={10}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
      scrollIndicatorInsets={{right: 1}}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  )
}

function SuggestedFollowsHeader() {
  const t = useTheme()

  return (
    <View
      style={
        isWeb
          ? [a.flex_row, a.px_md, a.pt_lg, a.pb_lg, a.gap_md]
          : [{flexDirection: 'row-reverse'}, a.p_lg, a.gap_md]
      }>
      <IconCircle icon={Person_Stroke2_Corner0_Rounded} size="lg" />
      <View style={[a.flex_1, a.gap_sm]}>
        <Text style={[a.flex_1, a.text_2xl, a.font_bold, t.atoms.text]}>
          <Trans>Suggested Accounts</Trans>
        </Text>
        <Text style={[t.atoms.text_contrast_high]}>
          <Trans>
            Follow more accounts to get connected to your interests and build
            your network.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function SuggestedFeedsHeader() {
  const t = useTheme()

  return (
    <View
      style={
        isWeb
          ? [
              a.flex_row,
              a.px_md,
              a.pt_lg,
              a.pb_lg,
              a.gap_md,
              a.border_t,
              t.atoms.border_contrast_low,
              a.mt_2xl,
            ]
          : [
              {flexDirection: 'row-reverse'},
              a.p_lg,
              a.gap_md,
              a.border_t,
              t.atoms.border_contrast_low,
              a.mt_2xl,
            ]
      }>
      <IconCircle
        icon={ListMagnifyingGlass_Stroke2_Corner0_Rounded}
        size="lg"
      />
      <View style={[a.flex_1, a.gap_sm]}>
        <Text style={[a.flex_1, a.text_2xl, a.font_bold, t.atoms.text]}>
          <Trans>Discover New Feeds</Trans>
        </Text>
        <Text style={[t.atoms.text_contrast_high]}>
          <Trans>
            Custom feeds built by the community bring you new experiences and
            help you find the content you love.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function useSuggestedFollowsV1(): [
  AppBskyActorDefs.ProfileViewBasic[],
  () => void,
] {
  const {currentAccount} = useSession()
  const [suggestions, setSuggestions] = React.useState<
    AppBskyActorDefs.ProfileViewBasic[]
  >([])
  const getSuggestedFollowsByActor = useGetSuggestedFollowersByActor()

  React.useEffect(() => {
    async function getSuggestions() {
      const friends = await getSuggestedFollowsByActor(
        currentAccount!.did,
      ).then(friendsRes => friendsRes.suggestions)

      if (!friends) return // :(

      const friendsOfFriends = new Map<
        string,
        AppBskyActorDefs.ProfileViewBasic
      >()

      await Promise.all(
        friends.slice(0, 4).map(friend =>
          getSuggestedFollowsByActor(friend.did).then(foafsRes => {
            for (const user of foafsRes.suggestions) {
              if (user.associated?.labeler) continue
              friendsOfFriends.set(user.did, user)
            }
          }),
        ),
      )

      setSuggestions(Array.from(friendsOfFriends.values()))
    }

    try {
      getSuggestions()
    } catch (e) {
      logger.error(`SearchScreenSuggestedFollows: failed to get suggestions`, {
        message: e,
      })
    }
  }, [currentAccount, setSuggestions, getSuggestedFollowsByActor])

  return [suggestions, async () => {}]
}

function useSuggestedFollowsV2(): [
  AppBskyActorDefs.ProfileViewBasic[],
  () => void,
] {
  const {data: suggestions, refetch} = useSuggestedFollowsQuery()

  const items: AppBskyActorDefs.ProfileViewBasic[] = []
  if (suggestions) {
    // Currently the responses contain duplicate items.
    // Needs to be fixed on backend, but let's dedupe to be safe.
    let seen = new Set()
    for (const page of suggestions.pages) {
      for (const actor of page.actors) {
        if (!seen.has(actor.did)) {
          seen.add(actor.did)
          items.push(actor)
        }
      }
    }
  }
  return [items, refetch]
}
