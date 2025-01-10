import React, {useContext} from 'react'
import {ScrollView, View} from 'react-native'
import {DrawerGestureContext} from 'react-native-drawer-layout'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {
  useTrendingSettings,
  useTrendingSettingsApi,
} from '#/state/preferences/trending'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import * as Prompt from '#/components/Prompt'
import {TrendingTopicLink} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

export function TrendingInterstitial() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return enabled && !trendingDisabled ? <Inner /> : null
}

export function Inner() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters([0, 'base', 0, 'base'])
  const trendingPrompt = Prompt.usePromptControl()
  const {setTrendingDisabled} = useTrendingSettingsApi()
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length

  const onConfirmHide = React.useCallback(() => {
    logEvent('trendingTopics:hide', {context: 'interstitial'})
    setTrendingDisabled(true)
  }, [setTrendingDisabled])

  const drawerGesture = useContext(DrawerGestureContext)!
  const trendingScrollGesture =
    Gesture.Native().blocksExternalGesture(drawerGesture)

  return error || noTopics ? null : (
    <View style={[t.atoms.border_contrast_low, a.border_t]}>
      <GestureDetector gesture={trendingScrollGesture}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast">
          <View style={[gutters, a.flex_row, a.align_center, a.gap_lg]}>
            <View style={{paddingLeft: 4, paddingRight: 2}}>
              <Graph size="sm" />
            </View>
            {isLoading ? (
              <View style={[a.py_lg, a.flex_row, a.gap_lg, a.align_center]}>
                <LoadingPlaceholder
                  width={80}
                  height={undefined}
                  style={{alignSelf: 'stretch'}}
                />
                <LoadingPlaceholder
                  width={50}
                  height={undefined}
                  style={{alignSelf: 'stretch'}}
                />
                <LoadingPlaceholder
                  width={120}
                  height={undefined}
                  style={{alignSelf: 'stretch'}}
                />
                <LoadingPlaceholder
                  width={30}
                  height={undefined}
                  style={{alignSelf: 'stretch'}}
                />
                <LoadingPlaceholder
                  width={180}
                  height={undefined}
                  style={{alignSelf: 'stretch'}}
                />
                <Text
                  style={[
                    t.atoms.text_contrast_medium,
                    a.text_sm,
                    a.font_bold,
                  ]}>
                  {' '}
                </Text>
              </View>
            ) : !trending?.topics ? null : (
              <>
                {trending.topics.map(topic => (
                  <TrendingTopicLink
                    key={topic.link}
                    topic={topic}
                    onPress={() => {
                      logEvent('trendingTopic:click', {context: 'interstitial'})
                    }}>
                    <View style={[a.py_lg]}>
                      <Text
                        style={[
                          t.atoms.text,
                          a.text_sm,
                          a.font_bold,
                          {opacity: 0.7}, // NOTE: we use opacity 0.7 instead of a color to match the color of the home pager tab bar
                        ]}>
                        {topic.topic}
                      </Text>
                    </View>
                  </TrendingTopicLink>
                ))}
                <Button
                  label={_(msg`Hide trending topics`)}
                  size="tiny"
                  variant="ghost"
                  color="secondary"
                  shape="round"
                  onPress={() => trendingPrompt.open()}>
                  <ButtonIcon icon={X} />
                </Button>
              </>
            )}
          </View>
        </ScrollView>
      </GestureDetector>

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
