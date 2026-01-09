import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/service-config'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {Trending3_Stroke2_Corner1_Rounded as TrendingIcon} from '#/components/icons/Trending'
import * as Prompt from '#/components/Prompt'
import {TrendingTopicLink} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

const TRENDING_LIMIT = 5

export function SidebarTrendingTopics() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return !enabled ? null : trendingDisabled ? null : <Inner />
}

function Inner() {
  const t = useTheme()
  const {_} = useLingui()
  const trendingPrompt = Prompt.usePromptControl()
  const {setTrendingDisabled} = useTrendingSettingsApi()
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length

  const onConfirmHide = () => {
    logger.metric('trendingTopics:hide', {context: 'sidebar'})
    setTrendingDisabled(true)
  }

  return error || noTopics ? null : (
    <>
      <View
        style={[a.p_lg, a.rounded_md, a.border, t.atoms.border_contrast_low]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.pb_md]}>
          <TrendingIcon width={16} height={16} fill={t.atoms.text.color} />
          <Text style={[a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text]}>
            <Trans>Trending</Trans>
          </Text>
          <Button
            variant="ghost"
            size="tiny"
            color="secondary"
            shape="round"
            label={_(msg`Trending options`)}
            onPress={() => trendingPrompt.open()}
            style={[a.bg_transparent, {marginTop: -6, marginRight: -6}]}>
            <ButtonIcon icon={Ellipsis} size="xs" />
          </Button>
        </View>

        <View style={[a.gap_xs]}>
          {isLoading ? (
            Array(TRENDING_LIMIT)
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
          ) : !trending?.topics ? null : (
            <>
              {trending.topics.slice(0, TRENDING_LIMIT).map((topic, i) => (
                <TrendingTopicLink
                  key={topic.link}
                  topic={topic}
                  style={[a.self_start]}
                  onPress={() => {
                    logger.metric('trendingTopic:click', {context: 'sidebar'})
                  }}>
                  {({hovered}) => (
                    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_snug,
                          t.atoms.text_contrast_low,
                          {minWidth: 16},
                        ]}>
                        {i + 1}.
                      </Text>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_snug,
                          hovered
                            ? [t.atoms.text, a.underline]
                            : t.atoms.text_contrast_medium,
                        ]}
                        numberOfLines={1}>
                        {topic.displayName ?? topic.topic}
                      </Text>
                    </View>
                  )}
                </TrendingTopicLink>
              ))}
            </>
          )}
        </View>
      </View>
      <Prompt.Basic
        control={trendingPrompt}
        title={_(msg`Hide trending topics?`)}
        description={_(msg`You can update this later from your settings.`)}
        confirmButtonCta={_(msg`Hide`)}
        onConfirm={onConfirmHide}
      />
    </>
  )
}
