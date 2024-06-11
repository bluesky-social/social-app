import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

const AVI_SIZE = 30
const AVI_BORDER = 1

/**
 * Shared logic to determine if `KnownFollowers` should be shown.
 *
 * Checks the # of actual returned users instead of the `count` value, because
 * `count` includes blocked users and `followers` does not.
 */
export function shouldShowKnownFollowers(
  knownFollowers?: AppBskyActorDefs.KnownFollowers,
) {
  return knownFollowers && knownFollowers.followers.length > 0
}

export function KnownFollowers({
  profile,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
}) {
  const cache = React.useRef<Map<string, AppBskyActorDefs.KnownFollowers>>(
    new Map(),
  )

  /*
   * Results for `knownFollowers` are not sorted consistently, so when
   * revalidating we can see a flash of this data updating. This cache prevents
   * this happening for screens that remain in memory. When pushing a new
   * screen, or once this one is popped, this cache is empty, so new data is
   * displayed.
   */
  if (profile.viewer?.knownFollowers && !cache.current.has(profile.did)) {
    cache.current.set(profile.did, profile.viewer.knownFollowers)
  }

  const cachedKnownFollowers = cache.current.get(profile.did)

  if (cachedKnownFollowers && shouldShowKnownFollowers(cachedKnownFollowers)) {
    return (
      <KnownFollowersInner
        profile={profile}
        cachedKnownFollowers={cachedKnownFollowers}
        moderationOpts={moderationOpts}
      />
    )
  }

  return null
}

function KnownFollowersInner({
  profile,
  moderationOpts,
  cachedKnownFollowers,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  cachedKnownFollowers: AppBskyActorDefs.KnownFollowers
}) {
  const t = useTheme()
  const {_} = useLingui()

  const textStyle = [
    a.flex_1,
    a.text_sm,
    a.leading_snug,
    t.atoms.text_contrast_medium,
  ]

  // list of users, minus blocks
  const returnedCount = cachedKnownFollowers.followers.length
  // db count, includes blocks
  const fullCount = cachedKnownFollowers.count
  // knownFollowers can return up to 5 users, but will exclude blocks
  // therefore, if we have less 5 users, use whichever count is lower
  const count =
    returnedCount < 5 ? Math.min(fullCount, returnedCount) : fullCount

  const slice = cachedKnownFollowers.followers.slice(0, 3).map(f => {
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
    <Link
      label={_(
        msg`Press to view followers of this account that you also follow`,
      )}
      to={makeProfileLink(profile, 'known-followers')}
      style={[
        a.flex_1,
        a.flex_row,
        a.gap_md,
        a.align_center,
        {marginLeft: -AVI_BORDER},
      ]}>
      {({hovered, pressed}) => (
        <>
          <View
            style={[
              {
                height: AVI_SIZE,
                width: AVI_SIZE + (slice.length - 1) * a.gap_md.gap,
              },
              pressed && {
                opacity: 0.5,
              },
            ]}>
            {slice.map(({profile: prof, moderation}, i) => (
              <View
                key={prof.did}
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
                  avatar={prof.avatar}
                  moderation={moderation.ui('avatar')}
                />
              </View>
            ))}
          </View>

          <Text
            style={[
              textStyle,
              hovered && {
                textDecorationLine: 'underline',
                textDecorationColor: t.atoms.text_contrast_medium.color,
              },
              pressed && {
                opacity: 0.5,
              },
            ]}
            numberOfLines={2}>
            <Trans>Followed by</Trans>{' '}
            {count > 2 ? (
              <>
                {slice.slice(0, 2).map(({profile: prof}, i) => (
                  <Text key={prof.did} style={textStyle}>
                    {prof.displayName}
                    {i === 0 && ', '}
                  </Text>
                ))}
                {', '}
                {plural(count - 2, {
                  one: 'and # other',
                  other: 'and # others',
                })}
              </>
            ) : count === 2 ? (
              slice.map(({profile: prof}, i) => (
                <Text key={prof.did} style={textStyle}>
                  {prof.displayName} {i === 0 ? _(msg`and`) + ' ' : ''}
                </Text>
              ))
            ) : (
              <Text key={slice[0].profile.did} style={textStyle}>
                {slice[0].profile.displayName}
              </Text>
            )}
          </Text>
        </>
      )}
    </Link>
  )
}
