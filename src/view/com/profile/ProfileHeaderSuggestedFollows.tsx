import React from 'react'
import {View, StyleSheet, ScrollView} from 'react-native'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated'
import {useQuery} from '@tanstack/react-query'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {observer} from 'mobx-react-lite'

import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {useFollowDid} from 'lib/hooks/useFollowDid'
import {Button} from 'view/com/util/forms/Button'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {Link} from 'view/com/util/Link'

const OUTER_PADDING = 10
const INNER_PADDING = 14
const CARD_HEIGHT = 170
const TOTAL_HEIGHT = CARD_HEIGHT + INNER_PADDING * 2 + OUTER_PADDING * 2

export function ProfileHeaderSuggestedFollows({
  actorDid,
  active,
}: {
  actorDid: string
  active: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const animatedHeight = useSharedValue(0)
  const animatedStyles = useAnimatedStyle(() => ({
    opacity: animatedHeight.value / TOTAL_HEIGHT,
    height: animatedHeight.value,
  }))

  React.useEffect(() => {
    if (active) {
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
  }, [active, animatedHeight])

  const {isLoading, data: suggestedFollows} = useQuery({
    cacheTime: 0,
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

        store.me.follows.hydrateProfiles(suggestions)

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
            height: CARD_HEIGHT + INNER_PADDING * 2,
            paddingTop: INNER_PADDING,
            paddingLeft: INNER_PADDING / 2,
          }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{alignItems: 'flex-start'}}>
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
          marginBottom: 6,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          height: 17,
          width: 70,
          borderRadius: 4,
          backgroundColor: pal.border.borderColor,
          marginBottom: 4,
        }}
      />
      <View
        style={{
          height: 12,
          width: 70,
          borderRadius: 4,
          backgroundColor: pal.border.borderColor,
          marginBottom: 6,
          opacity: 0.6,
        }}
      />
      <View
        style={{
          height: 32,
          borderRadius: 32,
          width: '100%',
          backgroundColor: pal.border.borderColor,
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
  const pal = usePalette('default')
  const store = useStores()
  const {following, toggle} = useFollowDid({did: profile.did})
  const moderation = moderateProfile(profile, store.preferences.moderationOpts)

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
          labelStyle={{textAlign: 'center', width: '100%'}}
          onPress={toggle}
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
