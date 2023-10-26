import React from 'react'
import {View, StyleSheet, Pressable, ScrollView} from 'react-native'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated'
import {useQuery} from '@tanstack/react-query'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

import * as Toast from '../util/Toast'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {useFollowProfile} from 'lib/hooks/useFollowProfile'
import {Button} from 'view/com/util/forms/Button'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {Link} from 'view/com/util/Link'
import {useAnalytics} from 'lib/analytics/analytics'
import {isWeb} from 'platform/detection'

const OUTER_PADDING = 10
const INNER_PADDING = 14
const TOTAL_HEIGHT = 250

export function ProfileHeaderSuggestedFollows({
  actorDid,
  active,
  requestDismiss,
}: {
  actorDid: string
  active: boolean
  requestDismiss: () => void
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const animatedHeight = useSharedValue(0)
  const animatedStyles = useAnimatedStyle(() => ({
    opacity: animatedHeight.value / TOTAL_HEIGHT,
    height: animatedHeight.value,
  }))

  React.useEffect(() => {
    if (active) {
      track('ProfileHeader:SuggestedFollowsOpened')

      animatedHeight.value = withTiming(TOTAL_HEIGHT, {
        duration: 500,
        easing: Easing.inOut(Easing.exp),
      })
    } else {
      animatedHeight.value = withTiming(0, {
        duration: 500,
        easing: Easing.inOut(Easing.exp),
      })
    }
  }, [active, animatedHeight, track])

  const {isLoading, data: suggestedFollows} = useQuery({
    enabled: active,
    cacheTime: 0,
    staleTime: 0,
    queryKey: ['suggested_follows_by_actor', actorDid],
    async queryFn() {
      try {
        const {
          data: {suggestions},
          success,
        } = await store.agent.app.bsky.graph.getSuggestedFollowsByActor({
          actor: actorDid,
        })

        if (!success) {
          return []
        }

        store.me.follows.hydrateMany(suggestions)

        return suggestions
      } catch (e) {
        return []
      }
    },
  })

  return (
    <Animated.View style={[{overflow: 'hidden', opacity: 0}, animatedStyles]}>
      <View style={{paddingVertical: OUTER_PADDING}}>
        <View
          style={{
            backgroundColor: pal.viewLight.backgroundColor,
            height: '100%',
            paddingTop: INNER_PADDING / 2,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 4,
              paddingBottom: INNER_PADDING / 2,
              paddingLeft: INNER_PADDING,
              paddingRight: INNER_PADDING / 2,
            }}>
            <Text type="sm-bold" style={[pal.textLight]}>
              Suggested for you
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={requestDismiss}
              hitSlop={10}
              style={{padding: INNER_PADDING / 2}}>
              <FontAwesomeIcon
                icon="x"
                size={12}
                style={pal.textLight as FontAwesomeIconStyle}
              />
            </Pressable>
          </View>

          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={isWeb}
            persistentScrollbar={true}
            scrollIndicatorInsets={{bottom: 0}}
            scrollEnabled={true}
            contentContainerStyle={{
              alignItems: 'flex-start',
              paddingLeft: INNER_PADDING / 2,
              paddingBottom: INNER_PADDING,
            }}>
            {isLoading ? (
              <>
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
                <SuggestedFollowSkeleton />
              </>
            ) : suggestedFollows ? (
              suggestedFollows.map(profile => (
                <SuggestedFollow key={profile.did} profile={profile} />
              ))
            ) : (
              <View />
            )}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  )
}

function SuggestedFollowSkeleton() {
  const pal = usePalette('default')
  return (
    <View
      style={[
        styles.suggestedFollowCardOuter,
        {
          backgroundColor: pal.view.backgroundColor,
        },
      ]}>
      <View
        style={{
          height: 60,
          width: 60,
          borderRadius: 60,
          backgroundColor: pal.viewLight.backgroundColor,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          height: 17,
          width: 70,
          borderRadius: 4,
          backgroundColor: pal.viewLight.backgroundColor,
          marginTop: 12,
          marginBottom: 4,
        }}
      />
      <View
        style={{
          height: 12,
          width: 70,
          borderRadius: 4,
          backgroundColor: pal.viewLight.backgroundColor,
          marginBottom: 12,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          height: 32,
          borderRadius: 32,
          width: '100%',
          backgroundColor: pal.viewLight.backgroundColor,
        }}
      />
    </View>
  )
}

const SuggestedFollow = observer(function SuggestedFollowImpl({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileView
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const {following, toggle} = useFollowProfile(profile)
  const moderation = moderateProfile(profile, store.preferences.moderationOpts)

  const onPress = React.useCallback(async () => {
    try {
      const {following: isFollowing} = await toggle()

      if (isFollowing) {
        track('ProfileHeader:SuggestedFollowFollowed')
      }
    } catch (e: any) {
      Toast.show('An issue occurred, please try again.')
    }
  }, [toggle, track])

  return (
    <Link
      href={makeProfileLink(profile)}
      title={profile.handle}
      asAnchor
      anchorNoUnderline>
      <View
        style={[
          styles.suggestedFollowCardOuter,
          {
            backgroundColor: pal.view.backgroundColor,
          },
        ]}>
        <UserAvatar
          size={60}
          avatar={profile.avatar}
          moderation={moderation.avatar}
        />

        <View style={{width: '100%', paddingVertical: 12}}>
          <Text
            type="xs-medium"
            style={[pal.text, {textAlign: 'center'}]}
            numberOfLines={1}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.profile,
            )}
          </Text>
          <Text
            type="xs-medium"
            style={[pal.textLight, {textAlign: 'center'}]}
            numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
        </View>

        <Button
          label={following ? 'Unfollow' : 'Follow'}
          type="inverted"
          labelStyle={{textAlign: 'center'}}
          onPress={onPress}
          withLoading
        />
      </View>
    </Link>
  )
})

const styles = StyleSheet.create({
  suggestedFollowCardOuter: {
    marginHorizontal: INNER_PADDING / 2,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 130,
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 1,
  },
})
