import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {type Shadow} from '#/state/cache/types'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {NewskieDialog} from '#/components/NewskieDialog'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_NATIVE} from '#/env'

export function ProfileHeaderHandle({
  profile,
  disableTaps,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  disableTaps?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const {invalidHandleDialogControl} = useGlobalDialogsControlContext()
  const invalidHandle = isInvalidHandle(profile.handle)
  const isOwnProfile = profile.did === currentAccount?.did
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy
  return (
    <View
      style={[a.flex_row, a.gap_sm, a.align_center, {maxWidth: '100%'}]}
      pointerEvents={disableTaps ? 'none' : IS_IOS ? 'auto' : 'box-none'}>
      <NewskieDialog profile={profile} disabled={disableTaps} />
      {profile.viewer?.followedBy && !blockHide ? (
        <View style={[t.atoms.bg_contrast_50, a.rounded_xs, a.px_sm, a.py_xs]}>
          <Text style={[t.atoms.text, a.text_sm]}>
            <Trans>Follows you</Trans>
          </Text>
        </View>
      ) : undefined}
      {invalidHandle && isOwnProfile && !disableTaps ? (
        <Button
          label={l`Learn why your handle is invalid`}
          accessibilityHint={l`Opens dialog with details and troubleshooting steps`}
          onPress={() => invalidHandleDialogControl.open()}
          style={[
            a.border,
            a.px_sm,
            a.py_xs,
            a.rounded_xs,
            {borderColor: t.palette.contrast_200},
          ]}
          hoverStyle={[t.atoms.bg_contrast_25]}>
          <Text style={[a.text_xs]}>
            <Trans>⚠Invalid Handle</Trans>
          </Text>
        </Button>
      ) : (
        <Text
          emoji
          numberOfLines={1}
          style={[
            invalidHandle
              ? [
                  a.border,
                  a.text_xs,
                  a.px_sm,
                  a.py_xs,
                  a.rounded_xs,
                  {borderColor: t.palette.contrast_200},
                ]
              : [a.text_md, a.leading_snug, t.atoms.text_contrast_medium],
            web({
              wordBreak: 'break-all',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }),
          ]}>
          {invalidHandle
            ? l`⚠Invalid Handle`
            : sanitizeHandle(
                profile.handle,
                '@',
                // forceLTR handled by CSS above on web
                IS_NATIVE,
              )}
        </Text>
      )}
    </View>
  )
}
