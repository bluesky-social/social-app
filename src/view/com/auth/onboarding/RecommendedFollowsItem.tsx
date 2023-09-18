import React from 'react'
import {View, StyleSheet, ActivityIndicator} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {FollowButton} from 'view/com/profile/FollowButton'
import {usePalette} from 'lib/hooks/usePalette'
import {SuggestedActor} from 'state/models/discovery/suggested-actors'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s} from 'lib/styles'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Text} from 'view/com/util/text/Text'
import Animated, {FadeInRight} from 'react-native-reanimated'

type Props = {
  item: SuggestedActor
}
export const RecommendedFollowsItem: React.FC<Props> = ({item}) => {
  const pal = usePalette('default')

  return (
    <Animated.View
      entering={FadeInRight}
      style={[styles.cardContainer, pal.view, pal.border]}>
      <ProfileCard key={item.did} profile={item} />
    </Animated.View>
  )
}

export const ProfileCard = observer(function ProfileCardImpl({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
}) {
  const store = useStores()
  const pal = usePalette('default')
  const moderation = moderateProfile(profile, store.preferences.moderationOpts)
  const [addingMoreSuggestions, setAddingMoreSuggestions] =
    React.useState(false)

  return (
    <View style={styles.card}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            avatar={profile.avatar}
            moderation={moderation.avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text
            type="lg"
            style={[s.bold, pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.profile,
            )}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
        </View>

        <FollowButton
          did={profile.did}
          onToggleFollow={async isFollow => {
            if (isFollow) {
              setAddingMoreSuggestions(true)
              await store.onboarding.suggestedActors.insertSuggestionsByActor(
                profile.did,
              )
              setAddingMoreSuggestions(false)
            }
          }}
        />
      </View>
      {profile.description ? (
        <View style={styles.details}>
          <Text style={pal.text} numberOfLines={4}>
            {profile.description as string}
          </Text>
        </View>
      ) : undefined}
      {addingMoreSuggestions ? (
        <View style={styles.addingMoreContainer}>
          <ActivityIndicator size="small" color={pal.colors.text} />
          <Text style={[pal.text]}>Finding similar accounts...</Text>
        </View>
      ) : null}
    </View>
  )
})

const styles = StyleSheet.create({
  cardContainer: {
    borderTopWidth: 1,
  },
  card: {
    paddingHorizontal: 10,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutAvi: {
    width: 54,
    paddingLeft: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  details: {
    paddingLeft: 54,
    paddingRight: 10,
    paddingBottom: 10,
  },
  addingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
})
