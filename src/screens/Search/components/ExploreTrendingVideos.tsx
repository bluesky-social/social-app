import React from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyEmbedVideo, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {VIDEO_FEED_URI} from '#/lib/constants'
import {makeCustomFeedLink} from '#/lib/routes/links'
import {logEvent} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {useSavedFeeds} from '#/state/queries/feed'
import {RQKEY, usePostFeedQuery} from '#/state/queries/post-feed'
import {useAddSavedFeedsMutation} from '#/state/queries/preferences'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {GradientFill} from '#/components/GradientFill'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Pin_Stroke2_Corner0_Rounded as Pin} from '#/components/icons/Pin'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {
  CompactVideoPostCard,
  CompactVideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

const CARD_WIDTH = 100

const FEED_DESC = `feedgen|${VIDEO_FEED_URI}`
const FEED_PARAMS: {
  feedCacheKey: 'explore'
} = {
  feedCacheKey: 'explore',
}

export function ExploreTrendingVideos() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base'])
  const {data, isLoading, error} = usePostFeedQuery(FEED_DESC, FEED_PARAMS)

  // Refetch on tab change if nothing else is using this query.
  const queryClient = useQueryClient()
  useFocusEffect(() => {
    return () => {
      const query = queryClient
        .getQueryCache()
        .find({queryKey: RQKEY(FEED_DESC, FEED_PARAMS)})
      if (query && query.getObserversCount() <= 1) {
        query.fetch()
      }
    }
  })

  const {data: saved} = useSavedFeeds()
  const isSavedAlready = React.useMemo(() => {
    return !!saved?.feeds?.some(info => info.config.value === VIDEO_FEED_URI)
  }, [saved])

  const {mutateAsync: addSavedFeeds, isPending: isPinPending} =
    useAddSavedFeedsMutation()
  const pinFeed = React.useCallback(
    (e: any) => {
      e.preventDefault()

      addSavedFeeds([
        {
          type: 'feed',
          value: VIDEO_FEED_URI,
          pinned: true,
        },
      ])

      // prevent navigation
      return false
    },
    [addSavedFeeds],
  )

  if (error) {
    return null
  }

  return (
    <View style={[a.pb_xl]}>
      <View
        style={[
          a.flex_row,
          isWeb
            ? [a.px_lg, a.py_lg, a.pt_2xl, a.gap_md]
            : [a.p_lg, a.pt_xl, a.gap_md],
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_1, a.gap_sm]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Graph
              size="lg"
              fill={t.palette.primary_500}
              style={{marginLeft: -2}}
            />
            <Text style={[a.text_2xl, a.font_heavy, t.atoms.text]}>
              <Trans>Trending Videos</Trans>
            </Text>
            <View style={[a.py_xs, a.px_sm, a.rounded_sm, a.overflow_hidden]}>
              <GradientFill gradient={tokens.gradients.primary} />
              <Text style={[a.text_sm, a.font_heavy, {color: 'white'}]}>
                <Trans>BETA</Trans>
              </Text>
            </View>
          </View>
          <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
            <Trans>Popular videos in your network.</Trans>
          </Text>
        </View>
      </View>

      <BlockDrawerGesture>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + tokens.space.sm}>
          <View
            style={[
              a.pt_lg,
              a.flex_row,
              a.gap_sm,
              {
                paddingLeft: gutters.paddingLeft,
                paddingRight: gutters.paddingRight,
              },
            ]}>
            {isLoading ? (
              Array(10)
                .fill(0)
                .map((_, i) => (
                  <View key={i} style={[{width: CARD_WIDTH}]}>
                    <CompactVideoPostCardPlaceholder />
                  </View>
                ))
            ) : error || !data ? (
              <Text>
                <Trans>Whoops! Trending videos failed to load.</Trans>
              </Text>
            ) : (
              <VideoCards data={data} />
            )}
          </View>
        </ScrollView>
      </BlockDrawerGesture>

      {!isSavedAlready && (
        <View
          style={[
            gutters,
            a.pt_lg,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.gap_xl,
          ]}>
          <Text style={[a.flex_1, a.text_sm, a.leading_snug]}>
            <Trans>
              Pin the trending videos feed to your home screen for easy access
            </Trans>
          </Text>
          <Button
            disabled={isPinPending}
            label={_(msg`Pin`)}
            size="small"
            variant="outline"
            color="secondary"
            onPress={pinFeed}>
            <ButtonText>{_(msg`Pin`)}</ButtonText>
            <ButtonIcon icon={Pin} position="right" />
          </Button>
        </View>
      )}
    </View>
  )
}

function VideoCards({
  data,
}: {
  data: Exclude<ReturnType<typeof usePostFeedQuery>['data'], undefined>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const items = React.useMemo(() => {
    return data.pages
      .flatMap(page => page.slices)
      .map(slice => slice.items[0])
      .filter(Boolean)
      .filter(item => AppBskyEmbedVideo.isView(item.post.embed))
      .slice(0, 8)
  }, [data])
  const href = React.useMemo(() => {
    const urip = new AtUri(VIDEO_FEED_URI)
    return makeCustomFeedLink(urip.host, urip.rkey, undefined, 'explore')
  }, [])

  return (
    <>
      {items.map(item => (
        <View key={item.post.uri} style={[{width: CARD_WIDTH}]}>
          <CompactVideoPostCard
            post={item.post}
            moderation={item.moderation}
            sourceContext={{
              type: 'feedgen',
              uri: VIDEO_FEED_URI,
              sourceInterstitial: 'explore',
            }}
            onInteract={() => {
              logEvent('videoCard:click', {
                context: 'interstitial:discover',
              })
            }}
          />
        </View>
      ))}

      <View style={[{width: CARD_WIDTH * 2}]}>
        <Link
          to={href}
          label={_(msg`View more`)}
          style={[
            a.justify_center,
            a.align_center,
            a.flex_1,
            a.rounded_md,
            t.atoms.bg_contrast_25,
          ]}>
          {({pressed}) => (
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_md,
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}>
              <Text style={[a.text_md]}>
                <Trans>View more</Trans>
              </Text>
              <View
                style={[
                  a.align_center,
                  a.justify_center,
                  a.rounded_full,
                  {
                    width: 34,
                    height: 34,
                    backgroundColor: t.palette.primary_500,
                  },
                ]}>
                <ButtonIcon icon={ChevronRight} />
              </View>
            </View>
          )}
        </Link>
      </View>
    </>
  )
}
