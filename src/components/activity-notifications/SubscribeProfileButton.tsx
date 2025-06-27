import {useCallback} from 'react'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon} from '#/components/icons/BellPlus'
import {BellRinging_Filled_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import type * as bsky from '#/types/bsky'
import {SubscribeProfileDialog} from './SubscribeProfileDialog'

export function SubscribeProfileButton({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const {_} = useLingui()
  const requireEmailVerification = useRequireEmailVerification()
  const subscribeDialogControl = useDialogControl()

  const onPress = useCallback(() => {
    subscribeDialogControl.open()
  }, [subscribeDialogControl])

  const name = createSanitizedDisplayName(profile, true)

  const wrappedOnPress = requireEmailVerification(onPress, {
    instructions: [
      <Trans key="message">
        Before you can get notifications for {name}'s posts, you must first
        verify your email.
      </Trans>,
    ],
  })

  const isSubscribed =
    profile.viewer?.activitySubscription?.post ||
    profile.viewer?.activitySubscription?.reply

  const Icon = isSubscribed ? BellRingingIcon : BellPlusIcon

  return (
    <>
      <Button
        accessibilityRole="button"
        testID="dmBtn"
        size="small"
        color="secondary"
        variant="solid"
        shape="round"
        label={_(msg`Get notified when ${name} posts`)}
        style={[a.justify_center]}
        onPress={wrappedOnPress}>
        <ButtonIcon icon={Icon} size="md" />
      </Button>

      <SubscribeProfileDialog
        control={subscribeDialogControl}
        profile={profile}
        moderationOpts={moderationOpts}
      />
    </>
  )
}
