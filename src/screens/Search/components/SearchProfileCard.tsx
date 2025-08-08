import {useCallback} from 'react'
import {View} from 'react-native'
import {
  type AppGndrActorDefs,
  type ModerationOpts,
} from '@gander-social-atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'

export function SearchProfileCard({
  profile,
  moderationOpts,
  onPress: onPressInner,
}: {
  profile: AppGndrActorDefs.ProfileViewBasic
  moderationOpts: ModerationOpts
  onPress?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const qc = useQueryClient()

  const onPress = useCallback(() => {
    unstableCacheProfileView(qc, profile)
    onPressInner?.()
  }, [qc, profile, onPressInner])

  return (
    <Link
      testID={`searchAutoCompleteResult-${profile.handle}`}
      to={makeProfileLink(profile)}
      label={_(msg`View ${profile.handle}'s profile`)}
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
