import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {makeRecordUri} from '../lib/strings'

export const PostLikedBy = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, rkey} = params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle('Liked by')
    }
  }, [store, visible])

  return (
    <View>
      <ViewHeader title="Liked by" />
      <PostLikedByComponent uri={uri} />
    </View>
  )
}
