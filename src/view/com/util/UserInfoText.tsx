import React, {useState, useEffect} from 'react'
import {AppBskyActorGetProfile as GetProfile} from '@atproto/api'
import {StyleProp, StyleSheet, TextStyle} from 'react-native'
import {Link} from './Link'
import {Text} from './text/Text'
import {LoadingPlaceholder} from './LoadingPlaceholder'
import {useStores} from 'state/index'
import {TypographyVariant} from 'lib/ThemeContext'

export function UserInfoText({
  type = 'md',
  did,
  attr,
  failed,
  prefix,
  style,
  asLink,
}: {
  type?: TypographyVariant
  did: string
  attr?: keyof GetProfile.OutputSchema
  loading?: string
  failed?: string
  prefix?: string
  style?: StyleProp<TextStyle>
  asLink?: boolean
}) {
  attr = attr || 'handle'
  failed = failed || 'user'

  const store = useStores()
  const [profile, setProfile] = useState<undefined | GetProfile.OutputSchema>(
    undefined,
  )
  const [didFail, setFailed] = useState<boolean>(false)

  useEffect(() => {
    let aborted = false
    store.profiles.getProfile(did).then(
      v => {
        if (aborted) {
          return
        }
        setProfile(v.data)
      },
      _err => {
        if (aborted) {
          return
        }
        setFailed(true)
      },
    )
    return () => {
      aborted = true
    }
  }, [did, store.profiles])

  let inner
  if (didFail) {
    inner = (
      <Text type={type} style={style} numberOfLines={1}>
        {failed}
      </Text>
    )
  } else if (profile) {
    inner = (
      <Text type={type} style={style} lineHeight={1.2} numberOfLines={1}>{`${
        prefix || ''
      }${profile[attr] || profile.handle}`}</Text>
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

  if (asLink) {
    const title = profile?.displayName || profile?.handle || 'User'
    return (
      <Link
        href={`/profile/${profile?.handle ? profile.handle : did}`}
        title={title}>
        {inner}
      </Link>
    )
  }

  return inner
}

const styles = StyleSheet.create({
  loadingPlaceholder: {position: 'relative', top: 1, left: 2},
})
