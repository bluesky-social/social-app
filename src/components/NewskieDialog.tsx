import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {differenceInSeconds} from 'date-fns'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {HITSLOP_10} from 'lib/constants'
import {isNative} from 'platform/detection'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Newskie} from '#/components/icons/Newskie'
import {Text} from '#/components/Typography'

export function NewskieDialog({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_} = useLingui()
  const control = useDialogControl()
  const profileName = profile.displayName || `@${profile.handle}`
  const timeAgo = useGetTimeAgo()
  const daysOld = React.useMemo(() => {
    if (!profile.createdAt) return Infinity
    return (
      differenceInSeconds(new Date(), new Date(profile.createdAt as string)) /
      86400
    )
  }, [profile.createdAt])

  if (!profile.createdAt) return null
  if (daysOld > 7) return null

  return (
    <>
      <Button
        label={_(
          msg`This user is new here. Press for more info about when they joined.`,
        )}
        hitSlop={HITSLOP_10}
        onPress={control.open}>
        <Newskie size={22} />
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={_(msg`New user info dialog`)}>
          <View style={[a.gap_md, isNative && {marginBottom: 40}]}>
            <Text style={[a.font_bold, a.text_xl]}>
              <Trans>Say hello!</Trans>
            </Text>
            <Text style={[a.text_md]}>
              <Trans>
                {profileName} recently joined Bluesky{' '}
                {timeAgo(profile.createdAt as string, {format: 'long'})} ago
              </Trans>
            </Text>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
