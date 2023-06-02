import React, {useState, useEffect} from 'react'
import {AppBskyActorGetProfile as GetProfile} from '@atproto/api'
import {StyleProp, StyleSheet, TextStyle} from 'react-native'
import {DesktopWebTextLink} from './Link'
import {Text} from './text/Text'
import {LoadingPlaceholder} from './LoadingPlaceholder'
import {useStores} from 'state/index'
import {TypographyVariant} from 'lib/ThemeContext'
import {sanitizeDisplayName} from 'lib/strings/display-names'

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
      <DesktopWebTextLink
        type={type}
        style={style}
        lineHeight={1.2}
        numberOfLines={1}
        href={`/profile/${profile.handle}`}
        text={`${prefix || ''}${sanitizeDisplayName(
          typeof profile[attr] === 'string' && profile[attr]
            ? (profile[attr] as string)
            : profile.handle,
        )}`}
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
