import React, {useState, useEffect} from 'react'
import * as TodoSocialGetProfile from '../../../third-party/api/src/types/todo/social/getProfile'
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
  attr?: keyof TodoSocialGetProfile.OutputSchema
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
    undefined | TodoSocialGetProfile.OutputSchema
  >(undefined)
  const [didFail, setFailed] = useState<boolean>(false)

  useEffect(() => {
    // TODO use caching to reduce loads
    store.api.todo.social.getProfile({user: did}).then(
      v => {
        setProfile(v.data)
      },
      _err => {
        setFailed(true)
      },
    )
  }, [did, store.api.todo.social])

  return (
    <Text style={style}>
      {didFail ? failed : profile ? `${prefix}${profile[attr]}` : loading}
    </Text>
  )
}
