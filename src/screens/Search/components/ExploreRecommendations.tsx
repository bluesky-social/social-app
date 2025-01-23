import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {logEvent} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {
  DEFAULT_LIMIT as RECOMMENDATIONS_COUNT,
  useTrendingTopics,
} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Hashtag_Stroke2_Corner0_Rounded} from '#/components/icons/Hashtag'
import {
  TrendingTopic,
  TrendingTopicLink,
  TrendingTopicSkeleton,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

export function ExploreRecommendations() {
  const {enabled} = useTrendingConfig()
  return enabled ? <Inner /> : null
}

function Inner() {
  const t = useTheme()
  const gutters = useGutters([0, 'compact'])
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noRecs = !isLoading && !error && !trending?.suggested?.length

  return error || noRecs ? null : (
    <>
      <View
        style={[
          a.flex_row,
          isWeb
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
            <Text style={[a.text_2xl, a.font_heavy, t.atoms.text]}>
              <Trans>Recommended</Trans>
            </Text>
          </View>
          <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
            <Trans>Feeds we think you might like.</Trans>
          </Text>
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
          ) : !trending?.suggested ? null : (
            <>
              {trending.suggested.map(topic => (
                <TrendingTopicLink
                  key={topic.link}
                  topic={topic}
                  onPress={() => {
                    logEvent('recommendedTopic:click', {context: 'explore'})
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
