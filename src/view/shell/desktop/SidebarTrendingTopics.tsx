import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/service-config'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import * as Prompt from '#/components/Prompt'
import {
  TrendingTopic,
  TrendingTopicLink,
  TrendingTopicSkeleton,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

const TRENDING_LIMIT = 6

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

  const onConfirmHide = React.useCallback(() => {
    logEvent('trendingTopics:hide', {context: 'sidebar'})
    setTrendingDisabled(true)
  }, [setTrendingDisabled])

  return error || noTopics ? null : (
    <>
      <View
        style={[
          a.gap_sm,
          a.py_md,
          a.px_md,
          a.rounded_md,
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <Text
            style={[
              a.flex_1,
              a.text_sm,
              a.font_semi_bold,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>Trending</Trans>
          </Text>
          <Button
            variant="ghost"
            size="tiny"
            color="secondary"
            shape="round"
            label={_(msg`Hide trending topics`)}
            onPress={() => trendingPrompt.open()}
            style={[a.bg_transparent]}>
            <ButtonIcon icon={X} size="xs" />
          </Button>
        </View>

        <View
          style={[a.flex_row, a.flex_wrap, {gap: '6px 4px', marginLeft: -4}]}>
          {isLoading ? (
            Array(TRENDING_LIMIT)
              .fill(0)
              .map((_n, i) => (
                <TrendingTopicSkeleton key={i} size="small" index={i} />
              ))
          ) : !trending?.topics ? null : (
            <>
              {trending.topics.slice(0, TRENDING_LIMIT).map(topic => (
                <TrendingTopicLink
                  key={topic.link}
                  topic={topic}
                  style={a.rounded_full}
                  onPress={() => {
                    logEvent('trendingTopic:click', {context: 'sidebar'})
                  }}>
                  {({hovered}) => (
                    <TrendingTopic
                      size="small"
                      topic={topic}
                      hovered={hovered}
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
