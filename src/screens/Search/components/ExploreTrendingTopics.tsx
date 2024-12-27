import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {
  DEFAULT_LIMIT as TRENDING_TOPICS_COUNT,
  useTrendingTopics,
} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {GradientFill} from '#/components/GradientFill'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Trending} from '#/components/icons/Trending2'
import * as Prompt from '#/components/Prompt'
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
  const {_} = useLingui()
  const gutters = useGutters([0, 'compact'])
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length
  const {setTrendingDisabled} = useTrendingSettingsApi()
  const trendingPrompt = Prompt.usePromptControl()

  const onConfirmHide = React.useCallback(() => {
    logEvent('trendingTopics:hide', {context: 'explore:trending'})
    setTrendingDisabled(true)
  }, [setTrendingDisabled])

  return error || noTopics ? null : (
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
        <Button
          label={_(msg`Hide trending topics`)}
          size="small"
          variant="ghost"
          color="secondary"
          shape="round"
          onPress={() => trendingPrompt.open()}>
          <ButtonIcon icon={X} />
        </Button>
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
                <TrendingTopicLink
                  key={topic.link}
                  topic={topic}
                  onPress={() => {
                    logEvent('trendingTopic:click', {context: 'explore'})
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
