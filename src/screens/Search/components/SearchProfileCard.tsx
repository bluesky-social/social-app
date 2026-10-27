import {useCallback} from 'react'
import {View} from 'react-native'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

export function SearchProfileCard({
  profile,
  moderationOpts,
  selection,
  onPress: onPressInner,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  selection?: {
    label: string
    onPress: () => void
  }
  onPress?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const qc = useQueryClient()

  const onPress = useCallback(() => {
    unstableCacheProfileView(qc, profile)
    onPressInner?.()
  }, [qc, profile, onPressInner])

  function renderContent({
    hovered,
    pressed,
  }: {
    hovered: boolean
    pressed: boolean
  }) {
    return (
      <View
        style={[
          a.flex_1,
          a.px_md,
          a.py_sm,
          (hovered || pressed) && t.atoms.bg_contrast_25,
        ]}>
        <ProfileCard.Outer>
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              disabledPreview={Boolean(selection)}
            />
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
            />
          </ProfileCard.Header>
        </ProfileCard.Outer>
      </View>
    )
  }

  if (selection) {
    return (
      <Button
        testID={`searchAutoCompleteResult-${profile.handle}`}
        label={selection.label}
        onPress={selection.onPress}
        style={a.justify_start}>
        {renderContent}
      </Button>
    )
  }

  return (
    <Link
      testID={`searchAutoCompleteResult-${profile.handle}`}
      to={makeProfileLink(profile)}
      label={l`View ${profile.handle}'s profile`}
      onPress={onPress}>
      {renderContent}
    </Link>
  )
}
