import React, {useEffect} from 'react'
import {makeRecordUri} from '../lib/strings'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const PostLikedBy = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'app.bsky.post', recordKey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle('Liked by')
    }
  }, [store, visible])

  return <PostLikedByComponent uri={uri} />
}
