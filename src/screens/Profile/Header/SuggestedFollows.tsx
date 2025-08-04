import {useEffect, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {ProfileGrid} from '#/components/FeedInterstitials'

export function ProfileHeaderSuggestedFollows({actorDid}: {actorDid: string}) {
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })

  return (
    <ProfileGrid
      isSuggestionsLoading={isLoading}
      profiles={data?.suggestions ?? []}
      recId={data?.recId}
      error={error}
      viewContext="profileHeader"
    />
  )
}

export const AnimatedSuggestedFollows = ({actorDid}: {actorDid: string}) => {
  const [contentHeight, setContentHeight] = useState(0)
  const animatedHeight = useSharedValue(0)

  useEffect(() => {
    if (contentHeight > 0) {
      animatedHeight.value = withTiming(contentHeight, {
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
      })
    }
  }, [contentHeight, animatedHeight])

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden',
  }))

  return (
    <Animated.View style={animatedStyle}>
      <View onLayout={e => setContentHeight(e.nativeEvent.layout.height)}>
        <ProfileHeaderSuggestedFollows actorDid={actorDid} />
      </View>
    </Animated.View>
  )
}
