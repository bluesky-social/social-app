import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const AVI_SIZE = 26
const AVI_BORDER = isNative ? 1 : 1

export function KnownFollowers({
  knownFollowers,
  moderationOpts,
}: {
  knownFollowers?: AppBskyActorDefs.KnownFollowers
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()

  if (!knownFollowers) {
    return (
      <Text
        style={[a.flex_1, a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
        <Trans>Not followed by anyone you know</Trans>
      </Text>
    )
  }

  return (
    <KnownFollowersInner
      knownFollowers={knownFollowers}
      moderationOpts={moderationOpts}
    />
  )
}

function KnownFollowersInner({
  knownFollowers,
  moderationOpts,
}: {
  knownFollowers: AppBskyActorDefs.KnownFollowers
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const {_} = useLingui()

  const textStyle = [
    a.flex_1,
    a.text_sm,
    a.leading_snug,
    t.atoms.text_contrast_medium,
  ]
  const count = knownFollowers.count
  const slice = knownFollowers.followers.slice(0, 3).map(f => {
    const moderation = moderateProfile(f, moderationOpts)
    return {
      profile: {
        ...f,
        displayName: sanitizeDisplayName(
          f.displayName || f.handle,
          moderation.ui('displayName'),
        ),
      },
      moderation,
    }
  })

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.gap_md,
        a.align_start,
        {marginLeft: -AVI_BORDER},
      ]}>
      <View
        style={[
          {
            height: AVI_SIZE,
            width: AVI_SIZE + (slice.length - 1) * a.gap_md.gap,
          },
        ]}>
        {slice.map(({profile, moderation}, i) => (
          <View
            key={profile.did}
            style={[
              a.absolute,
              a.rounded_full,
              {
                borderWidth: AVI_BORDER,
                borderColor: t.atoms.bg.backgroundColor,
                width: AVI_SIZE + AVI_BORDER * 2,
                height: AVI_SIZE + AVI_BORDER * 2,
                left: i * a.gap_md.gap,
                zIndex: AVI_BORDER - i,
              },
            ]}>
            <UserAvatar
              size={AVI_SIZE}
              avatar={profile.avatar}
              moderation={moderation.ui('avatar')}
            />
          </View>
        ))}
      </View>

      <Text style={[textStyle, a.pt_xs]} numberOfLines={3}>
        <Trans>Followed by</Trans>{' '}
        {count > 2 ? (
          <>
            {slice.slice(0, 2).map(({profile}, i) => (
              <Text key={profile.did} style={textStyle}>
                {profile.displayName}
                {i === 0 && ', '}
              </Text>
            ))}{' '}
            {plural(count - 2, {
              one: 'and # other',
              other: 'and # others',
            })}
          </>
        ) : count === 2 ? (
          slice.map(({profile}, i) => (
            <Text key={profile.did} style={textStyle}>
              {profile.displayName} {i === 0 ? _(msg`and`) : ''}{' '}
            </Text>
          ))
        ) : (
          <Text key={slice[0].profile.did} style={textStyle}>
            {slice[0].profile.displayName}
          </Text>
        )}
      </Text>
    </View>
  )
}
