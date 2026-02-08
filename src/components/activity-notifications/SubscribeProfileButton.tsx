import {useCallback, useEffect, useState} from 'react'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon} from '#/components/icons/BellPlus'
import {BellRinging_Filled_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
import {useActivitySubscriptionsNudged} from '#/storage/hooks/activity-subscriptions-nudged'
import type * as bsky from '#/types/bsky'
import {SubscribeProfileDialog} from './SubscribeProfileDialog'

export function SubscribeProfileButton({
  profile,
  moderationOpts,
  disableHint,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  disableHint?: boolean
}) {
  const {_} = useLingui()
  const requireEmailVerification = useRequireEmailVerification()
  const subscribeDialogControl = useDialogControl()
  const [activitySubscriptionsNudged, setActivitySubscriptionsNudged] =
    useActivitySubscriptionsNudged()
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (!activitySubscriptionsNudged) {
      const timeout = setTimeout(() => {
        setShowTooltip(true)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [activitySubscriptionsNudged])

  const onDismissTooltip = (visible: boolean) => {
    if (visible) return

    setShowTooltip(false)
    setActivitySubscriptionsNudged(true)
  }

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

  const tooltipVisible = showTooltip && !disableHint

  return (
    <>
      <Tooltip.Outer
        visible={tooltipVisible}
        onVisibleChange={onDismissTooltip}
        position="bottom">
        <Tooltip.Target>
          <Button
            accessibilityRole="button"
            testID="dmBtn"
            size="small"
            color={tooltipVisible ? 'primary_subtle' : 'secondary'}
            shape="round"
            label={_(msg`Get notified when ${name} posts`)}
            onPress={wrappedOnPress}>
            <ButtonIcon icon={Icon} size="md" />
          </Button>
        </Tooltip.Target>
        <Tooltip.TextBubble>
          <Text>
            <Trans>Get notified about new posts</Trans>
          </Text>
        </Tooltip.TextBubble>
      </Tooltip.Outer>

      <SubscribeProfileDialog
        control={subscribeDialogControl}
        profile={profile}
        moderationOpts={moderationOpts}
      />
    </>
  )
}
