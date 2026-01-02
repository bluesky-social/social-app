import {type StyleProp, type TextStyle} from 'react-native'
import {type AppBskyActorGetProfile} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {STALE} from '#/state/queries'
import {useProfileQuery} from '#/state/queries/profile'
import {atoms as a} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {LoadingPlaceholder} from './LoadingPlaceholder'

export function UserInfoText({
  did,
  attr,
  failed,
  prefix,
  style,
}: {
  did: string
  attr?: keyof AppBskyActorGetProfile.OutputSchema
  loading?: string
  failed?: string
  prefix?: string
  style?: StyleProp<TextStyle>
}) {
  attr = attr || 'handle'
  failed = failed || 'user'

  const {data: profile, isError} = useProfileQuery({
    did,
    staleTime: STALE.INFINITY,
  })

  if (isError) {
    return (
      <Text style={style} numberOfLines={1}>
        {failed}
      </Text>
    )
  } else if (profile) {
    const text = `${prefix || ''}${sanitizeDisplayName(
      typeof profile[attr] === 'string' && profile[attr]
        ? (profile[attr] as string)
        : sanitizeHandle(profile.handle),
    )}`
    return (
      <InlineLinkText
        label={text}
        style={style}
        numberOfLines={1}
        to={makeProfileLink(profile)}>
        <Text emoji style={style}>
          {text}
        </Text>
      </InlineLinkText>
    )
  }

  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <LoadingPlaceholder
      width={80}
      height={8}
      style={[a.relative, {top: 1, left: 2}]}
    />
  )
}
