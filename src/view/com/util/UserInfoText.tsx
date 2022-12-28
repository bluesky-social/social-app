import React, {useState, useEffect} from 'react'
import {AppBskyActorGetProfile as GetProfile} from '@atproto/api'
import {StyleProp, TextStyle} from 'react-native'
import {Link} from './Link'
import {Text} from './text/Text'
import {LoadingPlaceholder} from './LoadingPlaceholder'
import {useStores} from '../../../state'

export function UserInfoText({
  did,
  attr,
  loading,
  failed,
  prefix,
  style,
  asLink,
}: {
  did: string
  attr?: keyof GetProfile.OutputSchema
  loading?: string
  failed?: string
  prefix?: string
  style?: StyleProp<TextStyle>
  asLink?: boolean
}) {
  attr = attr || 'handle'
  loading = loading || '...'
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
        if (aborted) return
        setProfile(v.data)
      },
      _err => {
        if (aborted) return
        setFailed(true)
      },
    )
    return () => {
      aborted = true
    }
  }, [did, store.api.app.bsky])

  let inner
  if (didFail) {
    inner = <Text style={style}>{failed}</Text>
  } else if (profile) {
    inner = <Text style={style}>{`${prefix || ''}${profile[attr]}`}</Text>
  } else {
    inner = (
      <LoadingPlaceholder
        width={80}
        height={8}
        style={{position: 'relative', top: 1, left: 2}}
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
