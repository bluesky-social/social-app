import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {isNative} from '#/platform/detection'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {atoms as a, useBreakpoints,useGutters, useTheme, web} from '#/alf'
import {Button, ButtonIcon,ButtonText} from '#/components/Button'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Trending2_Stroke2_Corner2_Rounded as Graph} from '#/components/icons/Trending2'
import {
  TrendingTopic,
  TrendingTopicLink,
  TrendingTopicSkeleton,
} from '#/components/TrendingTopics'
import {Text} from '#/components/Typography'

const TRENDS_COUNT = 9

export function FeedEnd() {
  const t = useTheme()
  const {_} = useLingui()
  const gutters = useGutters(['wide'])
  const {enabled} = useTrendingConfig()
  const navigation = useNavigationDeduped()
  const {gtTablet} = useBreakpoints()

  const onPressExplore = React.useCallback(() => {
    if (isNative) {
      navigation.navigate('SearchTab')
      navigation.popToTop()
    } else {
      navigation.navigate('Search', {})
    }
  }, [navigation])

  return (
    <View
      style={[
        a.align_center,
        gutters,
        a.py_5xl,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.gap_sm, a.pb_2xl]}>
        <Text
          style={[
            a.text_sm,
            a.leading_snug,
            a.text_center,
            {
              maxWidth: 200,
            },
            web({
              maxWidth: '12rem',
            }),
          ]}>
          <Trans>That's it! You've reached the end of this feed.</Trans>
        </Text>

        <Button
          label={_(msg`Explore Bluesky`)}
          onPress={onPressExplore}
          size="small"
          variant="solid"
          color="secondary"
          style={[a.justify_center]}>
          <ButtonIcon icon={Search} position="left" />
          <ButtonText>
            <Trans>Explore Bluesky</Trans>
          </ButtonText>
        </Button>
      </View>

      {enabled && !gtTablet ? <Trending /> : null}
    </View>
  )
}

function Trending() {
  const t = useTheme()
  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length
  const {gtMobile} = useBreakpoints()

  return error || noTopics ? null : (
    <View style={[a.gap_sm, gtMobile && a.px_2xl]}>
      <View style={[a.flex_row, a.align_center, a.justify_center, a.gap_xs]}>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>Check out what's trending</Trans>
        </Text>
        <Graph size="sm" />
      </View>

      <View style={[a.flex_row, a.flex_wrap, a.justify_center, a.gap_sm]}>
        {isLoading ? (
          Array(TRENDS_COUNT)
            .fill(0)
            .map((_n, i) => (
              <TrendingTopicSkeleton key={i} size="small" index={i} />
            ))
        ) : !trending?.topics ? null : (
          <>
            {trending.topics.slice(0, TRENDS_COUNT).map(topic => (
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
  )
}
