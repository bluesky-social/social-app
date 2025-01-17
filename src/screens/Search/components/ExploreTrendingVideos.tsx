import React from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_FEED_URI} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {useSavedFeeds} from '#/state/queries/feed'
import {usePostFeedQuery} from '#/state/queries/post-feed'
import {useAddSavedFeedsMutation} from '#/state/queries/preferences'
import {atoms as a, tokens,useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {GradientFill} from '#/components/GradientFill'
import {Pin_Stroke2_Corner0_Rounded as Pin} from '#/components/icons/Pin'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import {Text} from '#/components/Typography'
import {
  CompactVideoPostCard,
  CompactVideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

const CARD_WIDTH = 100

export function ExploreTrendingVideos() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base'])
  const {data, isLoading, error} = usePostFeedQuery(`feedgen|${VIDEO_FEED_URI}`)

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
            <Trans>A new way to experience video on Bluesky</Trans>
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={(CARD_WIDTH + a.gap_sm.gap) * 2}>
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
            data.pages
              .flatMap(page => page.slices)
              .map(slice => slice.items[0])
              .filter(Boolean)
              .filter(item => AppBskyEmbedVideo.isView(item.post.embed))
              .map(item => (
                <View key={item.post.uri} style={[{width: CARD_WIDTH}]}>
                  <CompactVideoPostCard
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
