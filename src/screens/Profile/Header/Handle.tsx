import {View} from 'react-native'
import {type ModerationDecision} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {type Shadow} from '#/state/cache/types'
import {atoms as a, useTheme, web} from '#/alf'
import {NewskieDialog} from '#/components/dialogs/NewskieDialog'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'

export function ProfileHeaderHandle({
  profile,
  moderation,
  disableTaps,
}: {
  profile: Shadow<app.bsky.actor.defs.ProfileViewDetailed>
  moderation: ModerationDecision
  disableTaps?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const invalidHandle = isInvalidHandle(profile.handle)
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy
  const pronouns = profile.pronouns?.trim()
  const showPronouns =
    !!pronouns && !blockHide && !moderation.ui('profileView').blur
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
      {/*
       * Inner row so a long handle shortens while the pronouns stay whole. The
       * 10pt gap matches the spacing between the follower counts in Metrics.tsx.
       */}
      <View style={[a.flex_row, a.flex_shrink, a.align_center, {gap: 10}]}>
        <Text
          emoji
          numberOfLines={1}
          style={[
            a.flex_shrink,
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
            ? _(msg`⚠Invalid Handle`)
            : sanitizeHandle(
                profile.handle,
                '@',
                // forceLTR handled by CSS above on web
                IS_NATIVE,
              )}
        </Text>
        {showPronouns && (
          // the handle truncates first so pronouns stay whole on the same line
          <Text
            emoji
            numberOfLines={1}
            testID="profileHeaderPronouns"
            style={[
              a.flex_shrink_0,
              a.text_md,
              a.leading_snug,
              // a step lighter than the handle
              {color: t.palette.contrast_600},
              web({unicodeBidi: 'isolate'}),
            ]}>
            {pronouns}
          </Text>
        )}
      </View>
    </View>
  )
}
