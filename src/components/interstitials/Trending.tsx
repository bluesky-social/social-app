import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTrendingSettingsApi} from '#/state/preferences/trending'
import {atoms as a, tokens, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {GradientFill} from '#/components/GradientFill'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import * as Prompt from '#/components/Prompt'
import {TrendingTopic, TrendingTopicLink} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'

export function TrendingInterstitial() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters(['base'])
  const trendingPrompt = Prompt.usePromptControl()
  const {data: topics, error, isLoading} = useTrendingTopics()
  const {setTrendingDiscoverHidden} = useTrendingSettingsApi()

  return (
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
          <Text style={[a.text_lg, a.font_heavy, t.atoms.text_contrast_medium]}>
            <Trans>Trending</Trans>
          </Text>
          <View style={[a.py_xs, a.px_sm, a.rounded_sm, a.overflow_hidden]}>
            <GradientFill gradient={tokens.gradients.primary} />
            <Text style={[a.text_md, a.font_heavy]}>BETA</Text>
          </View>
        </View>

        <Button
          label={_(msg`Hide trending topics from your feed`)}
          size="tiny"
          variant="outline"
          color="secondary"
          shape="round"
          onPress={() => trendingPrompt.open()}>
          <ButtonIcon icon={X} />
        </Button>
      </View>

      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
        {isLoading ? null : error || !topics ? null : (
          <>
            {topics.map(topic => (
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

      <Prompt.Basic
        control={trendingPrompt}
        title={_(msg`Hide trending topics in your feed?`)}
        description={_(
          msg`This is a device setting, and will apply to all accounts on this device. You can update this later from your settings.`,
        )}
        confirmButtonCta={_(msg`Hide`)}
        onConfirm={() => setTrendingDiscoverHidden(true)}
      />
    </View>
  )
}
