import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
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

export function SidebarTrendingTopics() {
  const {trendingSidebarHidden} = useTrendingSettings()
  return trendingSidebarHidden ? null : <Inner />
}

function Inner() {
  const t = useTheme()
  const {_} = useLingui()
  const trendingPrompt = Prompt.usePromptControl()
  const {setTrendingSidebarHidden} = useTrendingSettingsApi()

  const {data: topics, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !topics

  return error || noTopics ? null : (
    <>
      <View style={[a.gap_md]}>
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
            label={_(msg`Hide trending topics from your sidebar`)}
            size="tiny"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={() => trendingPrompt.open()}>
            <ButtonIcon icon={X} />
          </Button>
        </View>

        <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
          {isLoading ? (
            Array(8)
              .fill(0)
              .map((_, i) => <TrendingTopicSkeleton key={i} size="small" />)
          ) : error || !topics ? null : (
            <>
              {topics.map(topic => (
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
        description={_(
          msg`This is a device setting, and will apply to all accounts on this device. You can update this later from your settings.`,
        )}
        confirmButtonCta={_(msg`Hide`)}
        onConfirm={() => setTrendingSidebarHidden(true)}
      />
      <Divider />
    </>
  )
}
