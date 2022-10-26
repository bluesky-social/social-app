import React, {useState, useEffect} from 'react'
import * as AppBskyGetProfile from '../../../third-party/api/src/types/app/bsky/getProfile'
import {StyleProp, Text, TextStyle} from 'react-native'
import {useStores} from '../../../state'

export function UserInfoText({
  did,
  attr,
  loading,
  failed,
  prefix,
  style,
}: {
  did: string
  attr?: keyof AppBskyGetProfile.OutputSchema
  loading?: string
  failed?: string
  prefix?: string
  style?: StyleProp<TextStyle>
}) {
  attr = attr || 'name'
  loading = loading || '...'
  failed = failed || 'user'

  const store = useStores()
  const [profile, setProfile] = useState<
    undefined | AppBskyGetProfile.OutputSchema
  >(undefined)
  const [didFail, setFailed] = useState<boolean>(false)

  useEffect(() => {
    let aborted = false
    // TODO use caching to reduce loads
    store.api.app.bsky.getProfile({user: did}).then(
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

  return (
    <Text style={style}>
      {didFail ? failed : profile ? `${prefix}${profile[attr]}` : loading}
    </Text>
  )
}
