import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import Animated, {FadeInRight} from 'react-native-reanimated'
import {AppBskyActorDefs, ModerationDecision} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {Shadow, useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s} from 'lib/styles'
import {Button} from '#/view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'

type Props = {
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
  onFollowStateChange: (props: {
    did: string
    following: boolean
  }) => Promise<void>
}

export function RecommendedFollowsItem({
  profile,
  moderation,
  onFollowStateChange,
}: React.PropsWithChildren<Props>) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  const shadowedProfile = useProfileShadow(profile)

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
        key={profile.did}
        profile={shadowedProfile}
        onFollowStateChange={onFollowStateChange}
        moderation={moderation}
      />
    </Animated.View>
  )
}

function ProfileCard({
  profile,
  onFollowStateChange,
  moderation,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewBasic>
  moderation: ModerationDecision
  onFollowStateChange: (props: {
    did: string
    following: boolean
  }) => Promise<void>
}) {
  const {track} = useAnalytics()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [addingMoreSuggestions, setAddingMoreSuggestions] =
    React.useState(false)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'RecommendedFollowsItem',
  )

  const onToggleFollow = React.useCallback(async () => {
    try {
      if (profile.viewer?.following) {
        await queueUnfollow()
      } else {
        setAddingMoreSuggestions(true)
        await queueFollow()
        await onFollowStateChange({did: profile.did, following: true})
        setAddingMoreSuggestions(false)
        track('Onboarding:SuggestedFollowFollowed')
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('RecommendedFollows: failed to toggle following', {
          message: e,
        })
      }
    } finally {
      setAddingMoreSuggestions(false)
    }
  }, [
    profile,
    queueFollow,
    queueUnfollow,
    setAddingMoreSuggestions,
    track,
    onFollowStateChange,
  ])

  return (
    <View style={styles.card}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            avatar={profile.avatar}
            moderation={moderation.ui('avatar')}
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
              moderation.ui('displayName'),
            )}
          </Text>
          <Text type="xl" style={[pal.textLight]} numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
        </View>

        <Button
          type={profile.viewer?.following ? 'default' : 'inverted'}
          labelStyle={styles.followButton}
          onPress={onToggleFollow}
          label={profile.viewer?.following ? _(msg`Unfollow`) : _(msg`Follow`)}
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
}

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
