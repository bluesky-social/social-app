import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
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
  const t = useTheme()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()
  const timeAgo = useGetTimeAgo()
  const control = useDialogControl()

  const isMe = profile.did === currentAccount?.did
  const createdAt = profile.createdAt as string | undefined

  const profileName = React.useMemo(() => {
    if (!moderationOpts) return profile.displayName || profile.handle
    const moderation = moderateProfile(profile, moderationOpts)
    return sanitizeDisplayName(
      profile.displayName || profile.handle,
      moderation.ui('displayName'),
    )
  }, [moderationOpts, profile])

  const [now] = React.useState(() => Date.now())
  const daysOld = React.useMemo(() => {
    if (!createdAt) return Infinity
    return differenceInSeconds(now, new Date(createdAt)) / 86400
  }, [createdAt, now])

  if (!createdAt || daysOld > 7) return null

  const getJoinMessage = () => {
    const timeAgoString = timeAgo(createdAt, now, {format: 'long'})

    if (isMe) {
      if (profile.joinedViaStarterPack) {
        return _(
          msg`You joined Bluesky using a starter pack ${timeAgoString} ago`,
        )
      } else {
        return _(msg`You joined Bluesky ${timeAgoString} ago`)
      }
    } else {
      if (profile.joinedViaStarterPack) {
        return _(
          msg`${profileName} joined Bluesky using a starter pack ${timeAgoString} ago`,
        )
      } else {
        return _(msg`${profileName} joined Bluesky ${timeAgoString} ago`)
      }
    }
  }

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
          style={web({width: 'auto', maxWidth: 400, minWidth: 200})}>
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
                {isMe ? (
                  <Trans>Welcome, friend!</Trans>
                ) : (
                  <Trans>Say hello!</Trans>
                )}
              </Text>
            </View>
            <Text style={[a.text_md, a.text_center, a.leading_snug]}>
              {getJoinMessage()}
            </Text>
            {profile.joinedViaStarterPack ? (
              <StarterPackCard.Link
                starterPack={profile.joinedViaStarterPack}
                onPress={() => {
                  control.close()
                }}>
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
                variant="solid"
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
      </Dialog.Outer>
    </View>
  )
}
