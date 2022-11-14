import React, {useState, useEffect} from 'react'
import * as GetProfile from '../../../third-party/api/src/client/types/app/bsky/actor/getProfile'
import {StyleProp, Text, TextStyle} from 'react-native'
import {Link} from './Link'
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

  if (asLink) {
    const title = profile?.displayName || profile?.handle || 'User'
    return (
      <Link
        href={`/profile/${profile?.handle ? profile.handle : did}`}
        title={title}>
        <Text style={style}>
          {didFail
            ? failed
            : profile
            ? `${prefix || ''}${profile[attr]}`
            : loading}
        </Text>
      </Link>
    )
  }

  return (
    <Text style={style}>
      {didFail ? failed : profile ? `${prefix || ''}${profile[attr]}` : loading}
    </Text>
  )
}
