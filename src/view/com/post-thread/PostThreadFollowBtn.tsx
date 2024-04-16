import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {useNavigation} from '@react-navigation/native'

import {Shadow, useProfileShadow} from 'state/cache/profile-shadow'
import {useProfileQuery} from 'state/queries/profile'
import {FollowButton} from 'view/com/profile/FollowButton'

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
  const profile: Shadow<AppBskyActorDefs.ProfileViewBasic> =
    useProfileShadow(profileUnshadowed)

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

  if (!showFollowBtn) return null

  return <FollowButton profile={profile} logContext="PostThreadItem" />
}
