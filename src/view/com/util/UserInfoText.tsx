import {StyleProp, StyleSheet, TextStyle} from 'react-native'
import {AppBskyActorGetProfile as GetProfile} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {TypographyVariant} from '#/lib/ThemeContext'
import {STALE} from '#/state/queries'
import {useProfileQuery} from '#/state/queries/profile'
import {TextLinkOnWebOnly} from './Link'
import {LoadingPlaceholder} from './LoadingPlaceholder'
import {Text} from './text/Text'

export function UserInfoText({
  type = 'md',
  did,
  attr,
  failed,
  prefix,
  style,
}: {
  type?: TypographyVariant
  did: string
  attr?: keyof GetProfile.OutputSchema
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

  let inner
  if (isError) {
    inner = (
      <Text type={type} style={style} numberOfLines={1}>
        {failed}
      </Text>
    )
  } else if (profile) {
    inner = (
      <TextLinkOnWebOnly
        type={type}
        style={style}
        lineHeight={1.2}
        numberOfLines={1}
        href={makeProfileLink(profile)}
        text={
          <Text emoji type={type} style={style} lineHeight={1.2}>
            {`${prefix || ''}${sanitizeDisplayName(
              typeof profile[attr] === 'string' && profile[attr]
                ? (profile[attr] as string)
                : sanitizeHandle(profile.handle),
            )}`}
          </Text>
        }
      />
    )
  } else {
    inner = (
      <LoadingPlaceholder
        width={80}
        height={8}
        style={styles.loadingPlaceholder}
      />
    )
  }

  return inner
}

const styles = StyleSheet.create({
  loadingPlaceholder: {position: 'relative', top: 1, left: 2},
})
