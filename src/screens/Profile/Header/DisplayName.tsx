import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, ModerationDecision} from '@atproto/api'

import {Shadow} from '#/state/cache/types'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'
import {NewskieDialog} from '#/components/StarterPack/NewskieDialog'
import {Text} from '#/components/Typography'

export function ProfileHeaderDisplayName({
  profile,
  moderation,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_md]}>
      <Text
        testID="profileHeaderDisplayName"
        style={[t.atoms.text, a.text_4xl, {fontWeight: '500'}]}>
        {sanitizeDisplayName(
          profile.displayName || sanitizeHandle(profile.handle),
          moderation.ui('displayName'),
        )}
      </Text>
      <View style={[a.h_full]}>
        <NewskieDialog profile={profile} />
      </View>
    </View>
  )
}
