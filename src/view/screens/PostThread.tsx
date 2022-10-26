import React, {useEffect} from 'react'
import {makeRecordUri} from '../lib/strings'
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

  return <PostThreadComponent uri={uri} />
}
