import React from 'react'
import {ScrollView,View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_FEED_URI} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {useTrendingSettingsApi} from '#/state/preferences/trending'
import {useSavedFeeds} from '#/state/queries/feed'
import {usePostFeedQuery} from '#/state/queries/post-feed'
import {useAddSavedFeedsMutation} from '#/state/queries/preferences'
import {atoms as a, useGutters,useTheme} from '#/alf'
import {Button, ButtonIcon,ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {Pin_Stroke2_Corner0_Rounded as Pin} from '#/components/icons/Pin'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import {Text} from '#/components/Typography'
import {
  VideoPostCard,
  VideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

const CARD_WIDTH = 100

export function TrendingVideos() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base'])
  const {data, isLoading, error} = usePostFeedQuery(`feedgen|${VIDEO_FEED_URI}`)
  const {setTrendingVideoDisabled} = useTrendingSettingsApi()

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

  const hide = React.useCallback(() => {
    setTrendingVideoDisabled(true)
    logEvent('trendingVideos:hide', {context: 'interstitial'})
  }, [setTrendingVideoDisabled])

  if (error) {
    return null
  }

  return (
    <View
      style={[
        a.pt_lg,
        a.pb_md,
        a.border_t,
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
          onPress={hide}>
          <ButtonIcon icon={X} />
        </Button>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={(CARD_WIDTH + a.gap_sm.gap) * 2}>
        <View
          style={[
            a.flex_row,
            a.gap_sm,
            a.pb_sm,
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
                  <VideoPostCardPlaceholder variant="compact" />
                </View>
              ))
          ) : error || !data ? (
            <Text>
              <Trans>Whoops! Trending videos failed to load.</Trans>
            </Text>
          ) : (
            data.pages
              .flatMap(page => page.slices)
              .map(slice => slice.items[0])
              .filter(Boolean)
              .filter(item => AppBskyEmbedVideo.isView(item.post.embed))
              .map(item => (
                <View key={item.post.uri} style={[{width: CARD_WIDTH}]}>
                  <VideoPostCard
                    variant="compact"
                    post={item.post}
                    moderation={item.moderation}
                    sourceContext={{
                      type: 'feedgen',
                      uri: VIDEO_FEED_URI,
                    }}
                    onInteract={() => {
                      logEvent('trendingVideo:click', {context: 'interstitial'})
                    }}
                  />
                </View>
              ))
          )}
        </View>
      </ScrollView>

      {!isSavedAlready && (
        <View style={[gutters, a.pt_xs]}>
          <Divider />

          <View
            style={[
              a.pt_sm,
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.gap_md,
            ]}>
            <Text style={[a.flex_1, a.text_sm, a.leading_snug]}>
              <Trans>Pin to your home screen for easy access</Trans>
            </Text>
            <Button
              disabled={isPinPending}
              label={_(msg`Pin`)}
              size="small"
              variant="solid"
              color="primary"
              onPress={pinFeed}>
              <ButtonText>{_(msg`Pin`)}</ButtonText>
              <ButtonIcon icon={Pin} position="right" />
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
