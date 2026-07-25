import {useCallback} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

export function SearchProfileCard({
  profile,
  moderationOpts,
  onPress: onPressInner,
  accessibilityLabel,
  accessibilityHint,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  onPress?: (event: GestureResponderEvent) => void | false
  accessibilityLabel?: string
  accessibilityHint?: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const qc = useQueryClient()

  const onPress = useCallback(
    (event: GestureResponderEvent): void | false => {
      unstableCacheProfileView(qc, profile)
      return onPressInner?.(event)
    },
    [qc, profile, onPressInner],
  )

  const label = accessibilityLabel ?? _(msg`View ${profile.handle}'s profile`)

  return (
    <Link
      testID={`searchAutoCompleteResult-${profile.handle}`}
      to={makeProfileLink(profile)}
      label={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}>
      {({hovered, pressed}) => (
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
              />
              <ProfileCard.NameAndHandle
                profile={profile}
                moderationOpts={moderationOpts}
              />
            </ProfileCard.Header>
          </ProfileCard.Outer>
        </View>
      )}
    </Link>
  )
}
