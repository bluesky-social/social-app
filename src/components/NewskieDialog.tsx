import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {differenceInSeconds} from 'date-fns'

import {HITSLOP_10} from '#/lib/constants'
import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {isNative} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Newskie} from '#/components/icons/Newskie'
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard'
import {Text} from '#/components/Typography'

export function NewskieDialog({
  profile,
  disabled,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  disabled?: boolean
}) {
  const {_} = useLingui()
  const control = useDialogControl()

  const createdAt = profile.createdAt as string | undefined

  const [now] = useState(() => Date.now())
  const daysOld = useMemo(() => {
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

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <DialogInner profile={profile} createdAt={createdAt} now={now} />
      </Dialog.Outer>
    </View>
  )
}

function DialogInner({
  profile,
  createdAt,
  now,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  createdAt: string
  now: number
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()
  const timeAgo = useGetTimeAgo()
  const isMe = profile.did === currentAccount?.did

  const profileName = useMemo(() => {
    const name = profile.displayName || profile.handle

    if (isMe) {
      return _(msg`You`)
    }

    if (!moderationOpts) return name
    const moderation = moderateProfile(profile, moderationOpts)

    return sanitizeDisplayName(name, moderation.ui('displayName'))
  }, [_, isMe, moderationOpts, profile])

  return (
    <Dialog.ScrollableInner
      label={_(msg`New user info dialog`)}
      style={web({maxWidth: 400})}>
      <View style={[a.gap_md]}>
        <View style={[a.align_center]}>
          <View
            style={[
              {
                height: 60,
                width: 64,
              },
            ]}>
            <Newskie
              width={64}
              height={64}
              fill="#FFC404"
              style={[a.absolute, a.inset_0]}
            />
          </View>
          <Text style={[a.font_bold, a.text_xl]}>
            {isMe ? <Trans>Welcome, friend!</Trans> : <Trans>Say hello!</Trans>}
          </Text>
        </View>
        <Text style={[a.text_md, a.text_center, a.leading_snug]}>
          {profile.joinedViaStarterPack ? (
            <Trans>
              {profileName} joined Bluesky using a starter pack{' '}
              {timeAgo(createdAt, now, {format: 'long'})} ago
            </Trans>
          ) : (
            <Trans>
              {profileName} joined Bluesky{' '}
              {timeAgo(createdAt, now, {format: 'long'})} ago
            </Trans>
          )}
        </Text>
        {profile.joinedViaStarterPack ? (
          <StarterPackCard.Link
            starterPack={profile.joinedViaStarterPack}
            onPress={() => control.close()}>
            <View
              style={[
                a.w_full,
                a.mt_sm,
                a.p_lg,
                a.border,
                a.rounded_sm,
                t.atoms.border_contrast_low,
              ]}>
              <StarterPackCard.Card
                starterPack={profile.joinedViaStarterPack}
              />
            </View>
          </StarterPackCard.Link>
        ) : null}

        {isNative && (
          <Button
            label={_(msg`Close`)}
            color="secondary"
            size="small"
            style={[a.mt_sm]}
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        )}
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
