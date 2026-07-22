import {View} from 'react-native'
import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {
  DEFAULT_LIMIT as RECOMMENDATIONS_COUNT,
  useGetTrendsQuery,
} from '#/state/queries/trending/useGetTrendsQuery'
import {useTrendingConfig} from '#/state/service-config'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Hashtag_Stroke2_Corner0_Rounded} from '#/components/icons/Hashtag'
import {
  TrendingTopic,
  TrendingTopicLink,
  TrendingTopicSkeleton,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

// Note: This module is not currently used and may be removed in the future.

export function ExploreRecommendations() {
  const {enabled} = useTrendingConfig()
  return enabled ? <Inner /> : null
}

function Inner() {
  const t = useTheme()
  const ax = useAnalytics()
  const gutters = useGutters([0, 'compact'])
  const {data: trending, error, isLoading} = useGetTrendsQuery()
  const noRecs = !isLoading && !error && !trending?.trends?.length
  const allFeeds = trending?.trends && isAllFeeds(trending.trends)

  return error || noRecs ? null : (
    <>
      <View
        style={[
          a.flex_row,
          IS_WEB
            ? [a.px_lg, a.py_lg, a.pt_2xl, a.gap_md]
            : [a.p_lg, a.pt_2xl, a.gap_md],
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_1, a.gap_sm]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Hashtag_Stroke2_Corner0_Rounded
              size="lg"
              fill={t.palette.primary_500}
              style={{marginLeft: -2}}
            />
            <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
              <Trans>Recommended</Trans>
            </Text>
          </View>
          {!allFeeds ? (
            <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
              <Trans>
                Content from across the network we think you might like.
              </Trans>
            </Text>
          ) : (
            <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
              <Trans>Feeds we think you might like.</Trans>
            </Text>
          )}
        </View>
      </View>

      <View style={[a.pt_md, a.pb_lg]}>
        <View
          style={[
            a.flex_row,
            a.justify_start,
            a.flex_wrap,
            {rowGap: 8, columnGap: 6},
            gutters,
          ]}>
          {isLoading ? (
            Array(RECOMMENDATIONS_COUNT)
              .fill(0)
              .map((_, i) => <TrendingTopicSkeleton key={i} index={i} />)
          ) : !trending?.trends ? null : (
            <>
              {trending.trends.map(topic => (
                <TrendingTopicLink
                  key={topic.link}
                  topic={topic}
                  onPress={() => {
                    ax.metric('recommendedTopic:click', {
                      context: 'explore',
                      recId: trending.recId,
                    })
                  }}>
                  {({hovered}) => (
                    <TrendingTopic
                      topic={topic}
                      style={[
                        hovered && [
                          t.atoms.border_contrast_high,
                          t.atoms.bg_contrast_25,
                        ],
                      ]}
                    />
                  )}
                </TrendingTopicLink>
              ))}
            </>
          )}
        </View>
      </View>
    </>
  )
}

function isAllFeeds(topics: AppBskyUnspeccedDefs.TrendView[]) {
  return topics.every(topic => {
    const segments = topic.link.split('/').slice(1)
    return segments[0] === 'profile' && segments[2] === 'feed'
  })
}
