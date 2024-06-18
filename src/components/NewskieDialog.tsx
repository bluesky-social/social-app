import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {differenceInSeconds} from 'date-fns'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {HITSLOP_10} from 'lib/constants'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Newskie} from '#/components/icons/Newskie'
import {Text} from '#/components/Typography'

export function NewskieDialog({
  profile,
  disabled,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  disabled?: boolean
}) {
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const control = useDialogControl()
  const profileName = React.useMemo(() => {
    const name = profile.displayName || profile.handle
    if (!moderationOpts) return name
    const moderation = moderateProfile(profile, moderationOpts)
    return sanitizeDisplayName(name, moderation.ui('displayName'))
  }, [moderationOpts, profile])
  const [now] = React.useState(() => Date.now())
  const timeAgo = useGetTimeAgo()
  const createdAt = profile.createdAt as string | undefined
  const daysOld = React.useMemo(() => {
    if (!createdAt) return Infinity
    return differenceInSeconds(now, new Date(createdAt)) / 86400
  }, [createdAt, now])

  if (!createdAt || daysOld > 7) return null

  return (
    <View style={[a.pr_2xs]}>
      <Button
        disabled={disabled}
        label={_(
          msg`This user is new here. Press for more info about when they joined.`,
        )}
        hitSlop={HITSLOP_10}
        onPress={control.open}>
        {({hovered, pressed}) => (
          <Newskie
            size="lg"
            fill="#FFC404"
            style={{
              opacity: hovered || pressed ? 0.5 : 1,
            }}
          />
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`New user info dialog`)}
          style={[{width: 'auto', maxWidth: 400, minWidth: 200}]}>
          <View style={[a.gap_sm]}>
            <Text style={[a.font_bold, a.text_xl]}>
              <Trans>Say hello!</Trans>
            </Text>
            <Text style={[a.text_md]}>
              <Trans>
                {profileName} joined Bluesky{' '}
                {timeAgo(createdAt, now, {format: 'long'})} ago
              </Trans>
            </Text>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </View>
  )
}
