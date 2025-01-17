import React from 'react'
import {ScrollView, View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {VIDEO_FEED_URI} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {useTrendingSettingsApi} from '#/state/preferences/trending'
import {usePostFeedQuery} from '#/state/queries/post-feed'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {
  CompactVideoPostCard,
  CompactVideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

const CARD_WIDTH = 100

export function TrendingVideos() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base'])
  const {data, isLoading, error} = usePostFeedQuery(`feedgen|${VIDEO_FEED_URI}`)
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
        a.pt_lg,
        a.pb_lg,
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
          onPress={() => trendingPrompt.open()}>
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
                      logEvent('videoCard:click', {
                        context: 'interstitial:discover',
                      })
                    }}
                  />
                </View>
              ))
          )}
        </View>
      </ScrollView>

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
