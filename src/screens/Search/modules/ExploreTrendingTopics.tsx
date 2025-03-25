import {View} from 'react-native'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useTrendingSettings} from '#/state/preferences/trending'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {atoms as a, native, useTheme} from '#/alf'
import {
  TrendingTopicRow,
  TrendingTopicRowSkeleton,
} from '#/components/TrendingTopics'

export function ExploreTrendingTopics() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return enabled && !trendingDisabled ? <Inner /> : null
}

function Inner() {
  const {_} = useLingui()
  const t = useTheme()

  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length

  return error || noTopics ? null : (
    <View style={native([a.border_b, t.atoms.border_contrast_low])}>
      {isLoading ? (
        Array.from({length: 5}).map((__, i) => (
          <TrendingTopicRowSkeleton key={i} withPosts={i === 0} />
        ))
      ) : !trending?.topics ? null : (
        <>
          {trending.topics
            // TEMP - slice should move to backend, or we need a show more button
            .slice(0, 5)
            .map((topic, index) => (
              <TrendingTopicRow
                key={topic.link}
                topic={topic}
                rank={index + 1}
                onPress={() => {
                  logger.metric('trendingTopic:click', {context: 'explore'})
                }}
              />
            ))}
        </>
      )}
    </View>
  )
}
