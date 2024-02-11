import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import Animated, {FadeOut} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

import {logger} from '#/logger'
import {Text} from 'view/com/util/text/Text'
import * as Toast from 'view/com/util/Toast'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Shadow, useProfileShadow} from 'state/cache/profile-shadow'
import {track} from 'lib/analytics/analytics'
import {
  useProfileFollowMutationQueue,
  useProfileQuery,
} from 'state/queries/profile'
import {useRequireAuth} from 'state/session'
import {isWeb} from 'platform/detection'

export function PostThreadFollowBtn({did}: {did: string}) {
  const {data: profile, isLoading} = useProfileQuery({did})

  // We will never hit this - the profile will always be cached or loaded above
  // but it keeps the typechecker happy
  if (isLoading || !profile) return null

  return <PostThreadFollowBtnLoaded profile={profile} />
}

function PostThreadFollowBtnLoaded({
  profile: profileUnshadowed,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const {isTabletOrDesktop} = useWebMediaQueries()
  const profile: Shadow<AppBskyActorDefs.ProfileViewBasic> =
    useProfileShadow(profileUnshadowed)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profile)
  const requireAuth = useRequireAuth()

  // We use this so we can control how long until the button disappears
  const [showFollowBtn, setShowFollowBtn] = React.useState(
    !profile.viewer?.following,
  )
  // Store the initial following state for our timeout
  const wasFollowing = React.useRef(!!profile.viewer?.following)
  const isFollowing = profile.viewer?.following

  React.useEffect(() => {
    let timeout: NodeJS.Timeout
    // If we were not initially following and the following state changes, we
    // want to set a timeout to remove the follow button
    if (!wasFollowing.current && isFollowing) {
      timeout = setTimeout(() => {
        // setShowFollowBtn(false) TODO uncomment
      }, 3000)
    }

    // If the follow state changes again we need to clear the timeout so it
    // doesn't disappear
    return () => {
      clearTimeout(timeout)
    }
  }, [isFollowing])

  // We this effect to run even when we come back. It needs to display the follow button again
  // if we unfollow from the profile screen
  useFocusEffect(
    React.useCallback(() => {
      if (!isFollowing && !showFollowBtn) {
        setShowFollowBtn(true)
        wasFollowing.current = false
      }
    }, [isFollowing, showFollowBtn]),
  )

  const onPress = React.useCallback(() => {
    if (!isFollowing) {
      requireAuth(async () => {
        try {
          track('ProfileHeader:FollowButtonClicked')
          await queueFollow()
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            logger.error('Failed to follow', {message: String(e)})
            Toast.show(_(msg`There was an issue! ${e.toString()}`))
          }
        }
      })
    } else {
      requireAuth(async () => {
        try {
          track('ProfileHeader:UnfollowButtonClicked')
          await queueUnfollow()
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            logger.error('Failed to unfollow', {message: String(e)})
            Toast.show(_(msg`There was an issue! ${e.toString()}`))
          }
        }
      })
    }
  }, [isFollowing, requireAuth, queueFollow, _, queueUnfollow])

  return (
    <View style={styles.container}>
      {showFollowBtn && (
        <Animated.View style={styles.btnOuter} exiting={FadeOut}>
          <TouchableOpacity
            testID="followBtn"
            onPress={onPress}
            style={[
              styles.btn,
              !isFollowing ? palInverted.view : pal.viewLight,
            ]}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Follow ${profile.handle}`)}
            accessibilityHint={_(
              msg`Shows posts from ${profile.handle} in your feed`,
            )}>
            {isTabletOrDesktop && (
              <FontAwesomeIcon
                icon={!isFollowing ? 'plus' : 'check'}
                style={[!isFollowing ? palInverted.text : pal.text, s.mr5]}
              />
            )}
            <Text
              type="button"
              style={[!isFollowing ? palInverted.text : pal.text, s.bold]}
              numberOfLines={1}>
              {!isFollowing ? <Trans>Follow</Trans> : <Trans>Following</Trans>}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 100,
  },
  btnOuter: {
    marginLeft: 'auto',
    // We have to use absolute position for this, otherwise the animation doesn't
    // work on web
    ...(isWeb && {
      position: 'absolute',
      right: 0,
    }),
  },
  btn: {
    flexDirection: 'row',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
})
