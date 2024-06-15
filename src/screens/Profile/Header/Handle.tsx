import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {Shadow} from '#/state/cache/types'
import {isInvalidHandle} from 'lib/strings/handles'
import {isAndroid} from 'platform/detection'
import {atoms as a, useTheme, web} from '#/alf'
import {NewskieDialog} from '#/components/StarterPack/NewskieDialog'
import {Text} from '#/components/Typography'

const DAYS_TO_SHOW_NEWSKIE = 7

export function ProfileHeaderHandle({
  profile,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
}) {
  const t = useTheme()
  const invalidHandle = isInvalidHandle(profile.handle)
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy
  const createdAt = profile.createdAt
    ? new Date(profile.createdAt).getTime()
    : 0

  const isNewskie =
    createdAt > 0 && Date.now() + 60e3 * 24 * DAYS_TO_SHOW_NEWSKIE > createdAt

  return (
    <View
      style={[a.flex_row, a.gap_xs, a.align_center]}
      pointerEvents={isAndroid ? 'box-only' : 'auto'}>
      {isNewskie && (
        <View style={[a.mr_xs]}>
          <NewskieDialog profile={profile} />
        </View>
      )}

      {profile.viewer?.followedBy && !blockHide ? (
        <View style={[t.atoms.bg_contrast_25, a.rounded_xs, a.px_sm, a.py_xs]}>
          <Text style={[t.atoms.text, a.text_sm]}>
            <Trans>Follows you</Trans>
          </Text>
        </View>
      ) : undefined}
      <Text
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
            : [a.text_md, a.leading_tight, t.atoms.text_contrast_medium],
          web({wordBreak: 'break-all'}),
        ]}>
        {invalidHandle ? <Trans>⚠Invalid Handle</Trans> : `@${profile.handle}`}
      </Text>
    </View>
  )
}
