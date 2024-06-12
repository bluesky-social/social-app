import React from 'react'
import {Pressable, View} from 'react-native'
import {AppBskyActorDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from 'lib/constants'
import {ago} from 'lib/strings/time'
import {isNative} from 'platform/detection'
import {useSession} from 'state/session'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useDialogControl} from '#/components/Dialog'
import {Newskie} from '#/components/icons/Newskie'
import {StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {Text} from '#/components/Typography'

export function NewskieDialog({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const control = useDialogControl()
  const {joinedViaStarterPack} = profile
  const profileName = profile.displayName || `@${profile.handle}`

  if (!profile.createdAt) return null

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Open new user info dialog`)}
        accessibilityHint={_(
          msg`Opens a dialog with information about the new user`,
        )}
        hitSlop={HITSLOP_10}
        onPress={control.open}>
        <Newskie size={22} />
      </Pressable>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={_(msg`New user info dialog`)}>
          <View style={[a.gap_md, isNative && {marginBottom: 40}]}>
            <Text style={[a.font_bold, a.text_xl]}>
              <Trans>Say hello!</Trans>
            </Text>
            <Text style={[a.text_md]}>
              {AppBskyGraphStarterpack.isRecord(
                joinedViaStarterPack?.record,
              ) ? (
                <Trans>
                  {profileName} joined Bluesky {ago(profile.createdAt, true)}{' '}
                  ago with{' '}
                  {joinedViaStarterPack?.creator.did === currentAccount?.did
                    ? 'your'
                    : `${joinedViaStarterPack?.creator.displayName}'s` ||
                      `@${joinedViaStarterPack?.creator.handle}'s`}{' '}
                  starter pack.
                </Trans>
              ) : (
                <Trans>
                  {profileName} recently joined Bluesky {ago(profile.createdAt)}{' '}
                  ago
                </Trans>
              )}
            </Text>
            {joinedViaStarterPack && (
              <StarterPackCard
                starterPack={joinedViaStarterPack}
                type="dialog"
              />
            )}
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
