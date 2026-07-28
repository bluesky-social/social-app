import {useCallback, useEffect, useMemo} from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyEmbedVideo, AtUri} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {VIDEO_FEED_URI} from '#/lib/constants'
import {makeCustomFeedLink} from '#/lib/routes/links'
import {useTrendingSettingsApi} from '#/state/preferences/trending'
import {RQKEY, usePostFeedQuery} from '#/state/queries/post-feed'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {
  CompactVideoPostCard,
  CompactVideoPostCardPlaceholder,
} from '#/components/VideoPostCard'
import {useAnalytics} from '#/analytics'

const CARD_WIDTH = 108

const FEED_DESC = `feedgen|${VIDEO_FEED_URI}`
const FEED_PARAMS: {
  feedCacheKey: 'discover'
} = {
  feedCacheKey: 'discover',
}

export function TrendingVideos() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
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
        void query.fetch()
      }
    }
  }, [queryClient])

  const {setTrendingVideoDisabled} = useTrendingSettingsApi()
  const trendingPrompt = Prompt.usePromptControl()

  const onConfirmHide = useCallback(() => {
    setTrendingVideoDisabled(true)
    ax.metric('trendingVideos:hide', {context: 'interstitial:discover'})
  }, [ax, setTrendingVideoDisabled])

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
        <View style={[a.pl_xs, a.flex_row, a.align_center]}>
          <Text style={[a.flex_1, a.text_md, a.font_semi_bold]}>
            <Trans>Trending videos</Trans>
          </Text>
          <Button
            label={l`Dismiss this section`}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            style={[a.bg_transparent]}
            onPress={() => trendingPrompt.open()}>
            <ButtonIcon icon={EllipsisIcon} size="md" />
          </Button>
        </View>
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
        title={l`Hide trending videos?`}
        description={l`You can update this later from your settings.`}
        confirmButtonCta={l`Hide`}
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
  const ax = useAnalytics()
  const items = useMemo(() => {
    return data.pages
      .flatMap(page => page.slices)
      .map(slice => slice.items[0])
      .filter(Boolean)
      .filter(item => AppBskyEmbedVideo.isView(item.post.embed))
      .slice(0, 8)
  }, [data])

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
              ax.metric('videoCard:click', {
                context: 'interstitial:discover',
              })
            }}
          />
        </View>
      ))}

      <ViewMoreCard />
    </>
  )
}

function ViewMoreCard() {
  const t = useTheme()
  const {t: l} = useLingui()

  const href = useMemo(() => {
    const urip = new AtUri(VIDEO_FEED_URI)
    return makeCustomFeedLink(urip.host, urip.rkey, undefined, 'discover')
  }, [])

  return (
    <View style={[{width: CARD_WIDTH * 2}]}>
      <Link
        to={href}
        label={l`View more`}
        style={[
          a.justify_center,
          a.align_center,
          a.flex_1,
          a.rounded_xl,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg,
          t.atoms.shadow_md,
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
            <Button
              color="primary"
              size="small"
              shape="round"
              label={l`View more trending videos`}>
              <ButtonIcon icon={ChevronRight} />
            </Button>
          </View>
        )}
      </Link>
    </View>
  )
}
