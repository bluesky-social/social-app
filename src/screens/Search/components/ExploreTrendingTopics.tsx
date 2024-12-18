import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {isWeb} from '#/platform/detection'
import {useTrendingSettings} from '#/state/preferences/trending'
import {
  DEFAULT_LIMIT as TRENDING_TOPICS_COUNT,
  useTrendingTopics,
} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {GradientFill} from '#/components/GradientFill'
import {Trending2_Stroke2_Corner2_Rounded as Trending} from '#/components/icons/Trending2'
import {
  TrendingTopic,
  TrendingTopicLink,
  TrendingTopicSkeleton,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

export function ExploreTrendingTopics() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return enabled && !trendingDisabled ? <Inner /> : null
}

function Inner() {
  const t = useTheme()
  const gutters = useGutters([0, 'compact'])
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length

  return error || noTopics ? null : (
    <>
      <View
        style={[
          isWeb
            ? [a.flex_row, a.px_lg, a.py_lg, a.pt_2xl, a.gap_md]
            : [{flexDirection: 'row-reverse'}, a.p_lg, a.pt_2xl, a.gap_md],
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_1, a.gap_sm]}>
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            <Trending
              size="lg"
              fill={t.palette.primary_500}
              style={{marginLeft: -2}}
            />
            <Text style={[a.text_2xl, a.font_heavy, t.atoms.text]}>
              <Trans>Trending</Trans>
            </Text>
            <View style={[a.py_xs, a.px_sm, a.rounded_sm, a.overflow_hidden]}>
              <GradientFill gradient={tokens.gradients.primary} />
              <Text style={[a.text_sm, a.font_heavy, {color: 'white'}]}>
                <Trans>BETA</Trans>
              </Text>
            </View>
          </View>
          <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
            <Trans>What people are posting about.</Trans>
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
            Array(TRENDING_TOPICS_COUNT)
              .fill(0)
              .map((_, i) => <TrendingTopicSkeleton key={i} index={i} />)
          ) : !trending?.topics ? null : (
            <>
              {trending.topics.map(topic => (
                <TrendingTopicLink key={topic.link} topic={topic}>
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
