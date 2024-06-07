import React from 'react'
import {Pressable, View} from 'react-native'
import {AppBskyActorDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from 'lib/constants'
import {isNative} from 'platform/detection'
import {atoms as a} from '#/alf'
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
  const joinedVia = profile.joinedViaStarterPack

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
              <Trans>{profileName} is new here!</Trans>
            </Text>
            <Text style={[]}>
              {AppBskyGraphStarterpack.isRecord(joinedVia?.record) ? (
                <Trans>
                  {profileName} recently joined Bluesky with{' '}
                  {joinedVia?.creator.displayName ||
                    `@${joinedVia?.creator.handle}`}
                  's starter pack!
                </Trans>
              ) : (
                <Trans>
                  {profileName} recently joined Bluesky on {profile.createdAt}.
                </Trans>
              )}
            </Text>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
