import React, {useEffect} from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyEmbedVideo, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {VIDEO_FEED_URI} from '#/lib/constants'
import {makeCustomFeedLink} from '#/lib/routes/links'
import {logEvent} from '#/lib/statsig/statsig'
import {useTrendingSettingsApi} from '#/state/preferences/trending'
import {usePostFeedQuery} from '#/state/queries/post-feed'
import {RQKEY} from '#/state/queries/post-feed'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {
  CompactVideoPostCard,
  CompactVideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

const CARD_WIDTH = 100

const FEED_DESC = `feedgen|${VIDEO_FEED_URI}`
const FEED_PARAMS: {
  feedCacheKey: 'discover'
} = {
  feedCacheKey: 'discover',
}

export function TrendingVideos() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base'])
  const {data, isLoading, error} = usePostFeedQuery(FEED_DESC, FEED_PARAMS)

  // Refetch on unmount if nothing else is using this query.
  const queryClient = useQueryClient()
  useEffect(() => {
    return () => {
      const query = queryClient
        .getQueryCache()
        .find({queryKey: RQKEY(FEED_DESC, FEED_PARAMS)})
      if (query && query.getObserversCount() <= 1) {
        query.fetch()
      }
    }
  }, [queryClient])

  const {setTrendingVideoDisabled} = useTrendingSettingsApi()
  const trendingPrompt = Prompt.usePromptControl()

  const onConfirmHide = React.useCallback(() => {
    setTrendingVideoDisabled(true)
    logEvent('trendingVideos:hide', {context: 'interstitial:discover'})
  }, [setTrendingVideoDisabled])

  if (error) {
    return null
  }

  return (
    <View
      style={[
        a.pt_sm,
        a.pb_lg,
        a.border_t,
        a.overflow_hidden,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <View
        style={[
          gutters,
          a.pb_sm,
          a.flex_row,
          a.align_center,
          a.justify_between,
        ]}>
        <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_xs]}>
          <Graph />
          <Text style={[a.text_md, a.font_bold, a.leading_snug]}>
            <Trans>Trending Videos</Trans>
          </Text>
        </View>
        <Button
          label={_(msg`Dismiss this section`)}
          size="tiny"
          variant="ghost"
          color="secondary"
          shape="round"
          onPress={() => trendingPrompt.open()}>
          <ButtonIcon icon={X} />
        </Button>
      </View>

      <BlockDrawerGesture>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + a.gap_md.gap}
          style={[a.overflow_visible]}>
          <View
            style={[
              a.flex_row,
              a.gap_md,
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

      <Prompt.Basic
        control={trendingPrompt}
        title={_(msg`Hide trending videos?`)}
        description={_(msg`You can update this later from your settings.`)}
        confirmButtonCta={_(msg`Hide`)}
        onConfirm={onConfirmHide}
      />
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
    return makeCustomFeedLink(urip.host, urip.rkey, undefined, 'discover')
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
              sourceInterstitial: 'discover',
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
            a.rounded_lg,
            a.border,
            t.atoms.border_contrast_low,
            t.atoms.bg,
            t.atoms.shadow_sm,
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
