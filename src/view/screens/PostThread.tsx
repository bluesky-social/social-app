import React, {useEffect} from 'react'
import {View} from 'react-native'
import {makeRecordUri} from '../lib/strings'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const PostThread = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, rkey} = params
  const uri = makeRecordUri(name, 'app.bsky.post', rkey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(`Post by ${name}`)
    }
  }, [visible, store.nav, name])

  return (
    <View>
      <ViewHeader title="Post" subtitle={`by ${name}`} />
      <PostThreadComponent uri={uri} />
    </View>
  )
}
