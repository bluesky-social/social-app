import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useTrendingSettings} from '#/state/preferences/trending'
import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {useTrendingConfig} from '#/state/trending-config'
import {
  TrendingTopicRow,
  TrendingTopicRowSkeleton,
} from '#/components/TrendingTopics'

const TOPIC_COUNT = 5

// smaller number = age of post is more important than post count
const RECENCY_BIAS = 0.3

export function ExploreTrendingTopics() {
  const {enabled} = useTrendingConfig()
  const {trendingDisabled} = useTrendingSettings()
  return enabled && !trendingDisabled ? <Inner /> : null
}

function Inner() {
  const {_} = useLingui()

  const {data: trending, error, isLoading} = useTrendingTopics()
  const noTopics = !isLoading && !error && !trending?.topics?.length

  return error || noTopics ? null : (
    <>
      {isLoading ? (
        Array.from({length: TOPIC_COUNT}).map((__, i) => (
          <TrendingTopicRowSkeleton key={i} withPosts={i === 0} />
        ))
      ) : !trending?.topics ? null : (
        <>
          {trending.topics
            .sort((t1, t2) => {
              const age1 =
                Date.now() - new Date(t1.startTime || Date.now()).getTime()
              const age2 =
                Date.now() - new Date(t2.startTime || Date.now()).getTime()
              const s1 = (t1.postCount ** RECENCY_BIAS / age1) * 100
              const s2 = t2.postCount ** RECENCY_BIAS / age2
              return s2 - s1
            })
            .slice(0, TOPIC_COUNT)
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
    </>
  )
}
