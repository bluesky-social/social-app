import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
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
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import * as Prompt from '#/components/Prompt'
import {
  TrendingTopic,
  TrendingTopicLink,
  TrendingTopicSkeleton,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

export function TrendingInterstitial() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return enabled && !trendingDisabled ? <Inner /> : null
}

export function Inner() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters(['wide', 'base'])
  const trendingPrompt = Prompt.usePromptControl()
  const {setTrendingDisabled} = useTrendingSettingsApi()
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length

  const onConfirmHide = React.useCallback(() => {
    logEvent('trendingTopics:hide', {context: 'interstitial'})
    setTrendingDisabled(true)
  }, [setTrendingDisabled])

  return error || noTopics ? null : (
    <View
      style={[
        gutters,
        a.gap_lg,
        a.border_t,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
          <Graph size="lg" />
          <Text style={[a.text_lg, a.font_heavy]}>
            <Trans>Trending</Trans>
          </Text>
          <View style={[a.py_xs, a.px_sm, a.rounded_sm, a.overflow_hidden]}>
            <GradientFill gradient={tokens.gradients.primary} />
            <Text style={[a.text_sm, a.font_heavy, {color: 'white'}]}>
              <Trans>BETA</Trans>
            </Text>
          </View>
        </View>

        <Button
          label={_(msg`Hide trending topics`)}
          size="tiny"
          variant="outline"
          color="secondary"
          shape="round"
          onPress={() => trendingPrompt.open()}>
          <ButtonIcon icon={X} />
        </Button>
      </View>

      <View style={[a.flex_row, a.flex_wrap, {rowGap: 8, columnGap: 6}]}>
        {isLoading ? (
          Array(TRENDING_TOPICS_COUNT)
            .fill(0)
            .map((_n, i) => <TrendingTopicSkeleton key={i} index={i} />)
        ) : !trending?.topics ? null : (
          <>
            {trending.topics.map(topic => (
              <TrendingTopicLink
                key={topic.link}
                topic={topic}
                onPress={() => {
                  logEvent('trendingTopic:click', {context: 'interstitial'})
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

      <Prompt.Basic
        control={trendingPrompt}
        title={_(msg`Hide trending topics?`)}
        description={_(msg`You can update this later from your settings.`)}
        confirmButtonCta={_(msg`Hide`)}
        onConfirm={onConfirmHide}
      />
    </View>
  )
}
