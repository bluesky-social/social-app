import React, {useEffect} from 'react'
import {makeRecordUri} from '../lib/strings'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const PostThread = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'blueskyweb.xyz:Posts', recordKey)

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(`Post by ${name}`)
    }
  }, [visible, store.nav, name])

  return <PostThreadComponent uri={uri} />
}
