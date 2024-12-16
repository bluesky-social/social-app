import {View} from 'react-native'

import {useTrendingTopics} from '#/state/queries/trending/useTrendingTopics'
import {atoms as a, useTheme, useGutters} from '#/alf'
import {TrendingTopic, TrendingTopicLink} from '#/components/TrendingTopics'

export function ExploreTrendingTopics() {
  const t = useTheme()
  const gutters = useGutters([0, 'compact'])
  const {data: topics, error, isLoading} = useTrendingTopics()

  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm, gutters]}>
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
  )
}
