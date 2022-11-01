import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostRepostedBy as PostRepostedByComponent} from '../com/post-thread/PostRepostedBy'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {makeRecordUri} from '../lib/strings'

export const PostRepostedBy = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, rkey} = params
  const uri = makeRecordUri(name, 'app.bsky.post', rkey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle('Reposted by')
    }
  }, [store, visible])

  return (
    <View>
      <ViewHeader title="Reposted by" />
      <PostRepostedByComponent uri={uri} />
    </View>
  )
}
