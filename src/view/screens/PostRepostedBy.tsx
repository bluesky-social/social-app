import React, {useEffect} from 'react'
import {makeRecordUri} from '../lib/strings'
import {PostRepostedBy as PostRepostedByComponent} from '../com/post-thread/PostRepostedBy'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const PostRepostedBy = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'app.bsky.post', recordKey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle('Reposted by')
    }
  }, [store, visible])

  return <PostRepostedByComponent uri={uri} />
}
