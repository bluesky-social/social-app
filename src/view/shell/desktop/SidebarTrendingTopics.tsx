import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {
  DEFAULT_LIMIT,
  useGetTrendsQuery,
} from '#/state/queries/trending/useGetTrendsQuery'
import {useTrendingConfig} from '#/state/service-config'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from '#/components/icons/Trending'
import {Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {
  TrendingTopicLink,
  TrendingTopicsPrompt,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function SidebarTrendingTopics() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return !enabled ? null : trendingDisabled ? null : <Inner />
}

function Inner() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()

  const exploreTopicCount = ax.features.getValue(
    ax.features.TrendingExploreTopicsCountValue,
    DEFAULT_LIMIT,
  )

  const trendingPrompt = Prompt.usePromptControl()
  const {setTrendingDisabled} = useTrendingSettingsApi()
  const {
    data: trending,
    error,
    isLoading,
  } = useGetTrendsQuery({
    refetchOnWindowFocus: true,
  })
  const noTopics = !isLoading && !error && !trending?.trends?.length

  const onConfirmHide = () => {
    ax.metric('trendingTopics:hide', {context: 'sidebar'})
    setTrendingDisabled(true)
  }

  return error || noTopics ? null : (
    <>
      <View
        style={[a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.pb_md]}>
          <TrendingIcon width={16} height={16} fill={t.atoms.text.color} />
          <Text style={[a.flex_1, a.text_md, a.font_semi_bold]}>
            <Trans>Trending</Trans>
          </Text>
          {exploreTopicCount > DEFAULT_LIMIT ? (
            <Link label={l`See more trending topics`} to="/search">
              {({hovered, pressed}) => (
                <Text
                  style={[
                    a.text_sm,
                    a.font_medium,
                    {
                      color:
                        hovered || pressed
                          ? t.palette.contrast_800
                          : t.palette.contrast_500,
                    },
                  ]}
                  numberOfLines={1}>
                  <Trans>See more</Trans>
                </Text>
              )}
            </Link>
          ) : null}
          <Button
            variant="ghost"
            size="tiny"
            color="secondary"
            shape="round"
            label={l`Trending options`}
            onPress={() => trendingPrompt.open()}
            style={[a.bg_transparent]}>
            <ButtonIcon icon={EllipsisIcon} size="xs" />
          </Button>
        </View>

        <View style={[a.gap_xs]}>
          {isLoading ? (
            Array(DEFAULT_LIMIT)
              .fill(0)
              .map((_n, i) => (
                <View key={i} style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <Text
                    style={[
                      a.text_sm,
                      t.atoms.text_contrast_low,
                      {minWidth: 16},
                    ]}>
                    {i + 1}.
                  </Text>
                  <View
                    style={[
                      a.rounded_xs,
                      t.atoms.bg_contrast_50,
                      {height: 14, width: i % 2 === 0 ? 80 : 100},
                    ]}
                  />
                </View>
              ))
          ) : !trending?.trends ? null : (
            <>
              {trending.trends.slice(0, DEFAULT_LIMIT).map((topic, i) => {
                const rank = i + 1
                return (
                  <TrendingTopicLink
                    key={topic.link}
                    topic={topic}
                    metricContext="sidebar"
                    rank={rank}
                    recId={trending.recId}
                    onPress={() => {
                      ax.metric('trendingTopic:click', {
                        context: 'sidebar',
                        rank,
                        recId: trending.recId,
                      })
                    }}>
                    {({hovered}) => (
                      <View style={[a.flex_1, a.flex_row, a.gap_xs]}>
                        <Text
                          style={[
                            a.text_sm,
                            a.leading_snug,
                            t.atoms.text_contrast_low,
                            {minWidth: 16},
                          ]}>
                          {rank}.
                        </Text>
                        <Text
                          style={[
                            a.flex_1,
                            a.text_sm,
                            a.leading_snug,
                            hovered
                              ? [t.atoms.text, a.underline]
                              : t.atoms.text_contrast_medium,
                          ]}>
                          {topic.displayName ?? topic.topic}
                        </Text>
                      </View>
                    )}
                  </TrendingTopicLink>
                )
              })}
            </>
          )}
        </View>
      </View>
      <TrendingTopicsPrompt
        control={trendingPrompt}
        onConfirm={onConfirmHide}
      />
    </>
  )
}
