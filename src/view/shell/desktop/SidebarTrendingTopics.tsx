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
import {useTrendingConfig} from '#/state/trending-config'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
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
      <View style={[a.gap_sm, {paddingBottom: 2}]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <Graph size="sm" />
          <Text
            style={[
              a.flex_1,
              a.text_sm,
              a.font_bold,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>Trending</Trans>
          </Text>
          <Button
            label={_(msg`Hide trending topics`)}
            size="tiny"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={() => trendingPrompt.open()}>
            <ButtonIcon icon={X} />
          </Button>
        </View>

        <View style={[a.flex_row, a.flex_wrap, {gap: '6px 4px'}]}>
          {isLoading ? (
            Array(TRENDING_LIMIT)
              .fill(0)
              .map((_n, i) => (
                <TrendingTopicSkeleton key={i} size="small" index={i} />
              ))
          ) : !trending?.topics ? null : (
            <>
              {trending.topics.slice(0, TRENDING_LIMIT).map(topic => (
                <TrendingTopicLink key={topic.link} topic={topic}>
                  {({hovered}) => (
                    <TrendingTopic
                      size="small"
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
      <Divider />
    </>
  )
}
