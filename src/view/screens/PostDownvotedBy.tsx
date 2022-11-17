import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostVotedBy as PostLikedByComponent} from '../com/post-thread/PostVotedBy'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {makeRecordUri} from '../lib/strings'

export const PostDownvotedBy = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, rkey} = params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, 'Downvoted by')
    }
  }, [store, visible])

  return (
    <View>
      <ViewHeader title="Downvoted by" />
      <PostLikedByComponent uri={uri} direction="down" />
    </View>
  )
}
