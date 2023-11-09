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
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useAnalytics} from 'lib/analytics/analytics'
import {Trans} from '@lingui/macro'

type Props = {
  item: SuggestedActor
  index: number
  insertSuggestionsByActor: (did: string, index: number) => Promise<void>
}
export const RecommendedFollowsItem: React.FC<Props> = ({
  item,
  index,
  insertSuggestionsByActor,
}) => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()

  return (
    <Animated.View
      entering={FadeInRight}
      style={[
        styles.cardContainer,
        pal.view,
        pal.border,
        {
          maxWidth: isMobile ? undefined : 670,
          borderRightWidth: isMobile ? undefined : 1,
        },
      ]}>
      <ProfileCard
        key={item.did}
        profile={item}
        index={index}
        insertSuggestionsByActor={insertSuggestionsByActor}
      />
    </Animated.View>
  )
}

export const ProfileCard = observer(function ProfileCardImpl({
  profile,
  index,
  insertSuggestionsByActor,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  index: number
  insertSuggestionsByActor: (did: string, index: number) => Promise<void>
}) {
  const {track} = useAnalytics()
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
            type="2xl-bold"
            style={[s.bold, pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.profile,
            )}
          </Text>
          <Text type="xl" style={[pal.textLight]} numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
        </View>

        <FollowButton
          profile={profile}
          labelStyle={styles.followButton}
          onToggleFollow={async isFollow => {
            if (isFollow) {
              setAddingMoreSuggestions(true)
              await insertSuggestionsByActor(profile.did, index)
              setAddingMoreSuggestions(false)
              track('Onboarding:SuggestedFollowFollowed')
            }
          }}
        />
      </View>
      {profile.description ? (
        <View style={styles.details}>
          <Text type="lg" style={pal.text} numberOfLines={4}>
            {profile.description as string}
          </Text>
        </View>
      ) : undefined}
      {addingMoreSuggestions ? (
        <View style={styles.addingMoreContainer}>
          <ActivityIndicator size="small" color={pal.colors.text} />
          <Text style={[pal.text]}>
            <Trans>Finding similar accounts...</Trans>
          </Text>
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
    paddingLeft: 54,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 4,
  },
  followButton: {
    fontSize: 16,
  },
})
