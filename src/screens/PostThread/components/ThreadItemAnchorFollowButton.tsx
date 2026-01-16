import React from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {
  useProfileFollowMutationQueue,
  useProfileQuery,
} from '#/state/queries/profile'
import {useRequireAuth} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {IS_IOS} from '#/env'
import {GrowthHack} from './GrowthHack'

export function ThreadItemAnchorFollowButton({did}: {did: string}) {
  if (IS_IOS) {
    return (
      <GrowthHack>
        <ThreadItemAnchorFollowButtonInner did={did} />
      </GrowthHack>
    )
  }

  return <ThreadItemAnchorFollowButtonInner did={did} />
}

export function ThreadItemAnchorFollowButtonInner({did}: {did: string}) {
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
  const {gtMobile} = useBreakpoints()
  const profile = useProfileShadow(profileUnshadowed)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'PostThreadItem',
  )
  const requireAuth = useRequireAuth()

  const isFollowing = !!profile.viewer?.following
  const isFollowedBy = !!profile.viewer?.followedBy
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
          await queueFollow()
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            logger.error('Failed to follow', {message: String(e)})
            Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
          }
        }
      })
    } else {
      requireAuth(async () => {
        try {
          await queueUnfollow()
        } catch (e: any) {
          if (e?.name !== 'AbortError') {
            logger.error('Failed to unfollow', {message: String(e)})
            Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
          }
        }
      })
    }
  }, [isFollowing, requireAuth, queueFollow, _, queueUnfollow])

  if (!showFollowBtn) return null

  return (
    <Button
      testID="followBtn"
      label={_(msg`Follow ${profile.handle}`)}
      onPress={onPress}
      size="small"
      color={isFollowing ? 'secondary' : 'secondary_inverted'}
      style={[a.rounded_full]}>
      {gtMobile && (
        <ButtonIcon icon={isFollowing ? CheckIcon : PlusIcon} size="sm" />
      )}
      <ButtonText>
        {!isFollowing ? (
          isFollowedBy ? (
            <Trans>Follow back</Trans>
          ) : (
            <Trans>Follow</Trans>
          )
        ) : (
          <Trans>Following</Trans>
        )}
      </ButtonText>
    </Button>
  )
}
