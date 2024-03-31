import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {logger} from '#/logger'
import {track} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s} from 'lib/styles'
import {Shadow, useProfileShadow} from 'state/cache/profile-shadow'
import {
  useProfileFollowMutationQueue,
  useProfileQuery,
} from 'state/queries/profile'
import {useRequireAuth} from 'state/session'
import {Text} from 'view/com/util/text/Text'
import * as Toast from 'view/com/util/Toast'

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
  const navigation = useNavigation()
  const {_} = useLingui()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const {isTabletOrDesktop} = useWebMediaQueries()
  const profile: Shadow<AppBskyActorDefs.ProfileViewBasic> =
    useProfileShadow(profileUnshadowed)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'PostThreadItem',
  )
  const requireAuth = useRequireAuth()

  const isFollowing = !!profile.viewer?.following
  const [wasFollowing, setWasFollowing] = React.useState<boolean>(isFollowing)

  // This prevents the button from disappearing as soon as we follow.
  const showFollowBtn = React.useMemo(
    () => !isFollowing || !wasFollowing,
    [isFollowing, wasFollowing],
  )

  /**
   * We want this button to stay visible even after following, so that the user can unfollow if they want.
   * However, we need it to disappear after we push to a screen and then come back. We also need it to
   * show up if we view the post while following, go to the profile and unfollow, then come back to the
   * post.
   *
   * We want to update wasFollowing both on blur and on focus so that we hit all these cases. On native,
   * we could do this only on focus because the transition animation gives us time to not notice the
   * sudden rendering of the button. However, on web if we do this, there's an obvious flicker once the
   * button renders. So, we update the state in both cases.
   */
  React.useEffect(() => {
    const updateWasFollowing = () => {
      if (wasFollowing !== isFollowing) {
        setWasFollowing(isFollowing)
      }
    }

    const unsubscribeFocus = navigation.addListener('focus', updateWasFollowing)
    const unsubscribeBlur = navigation.addListener('blur', updateWasFollowing)

    return () => {
      unsubscribeFocus()
      unsubscribeBlur()
    }
  }, [isFollowing, wasFollowing, navigation])

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

  if (!showFollowBtn) return null

  return (
    <View style={{width: isTabletOrDesktop ? 130 : 120}}>
      <View style={styles.btnOuter}>
        <TouchableOpacity
          testID="followBtn"
          onPress={onPress}
          style={[styles.btn, !isFollowing ? palInverted.view : pal.viewLight]}
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  btnOuter: {
    marginLeft: 'auto',
  },
  btn: {
    flexDirection: 'row',
    borderRadius: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
})
