import React, {useEffect, useMemo, useState} from 'react'
import {View} from 'react-native'
import {makeRecordUri} from '../../lib/strings'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {PostThreadViewModel} from '../../state/models/post-thread-view'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {s} from '../lib/styles'

export const PostThread = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, rkey} = params
  const [viewSubtitle, setViewSubtitle] = useState<string>(`by ${name}`)
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const view = useMemo<PostThreadViewModel>(
    () => new PostThreadViewModel(store, {uri}),
    [store, uri],
  )

  useEffect(() => {
    let aborted = false
    const threadCleanup = view.registerListeners()
    const setTitle = () => {
      const author = view.thread?.post.author
      const niceName = author?.handle || name
      setViewSubtitle(`by ${niceName}`)
      store.nav.setTitle(navIdx, `Post by ${niceName}`)
    }
    if (!visible) {
      return threadCleanup
    }
    setTitle()
    store.shell.setMinimalShellMode(false)
    if (!view.hasLoaded && !view.isLoading) {
      view.setup().then(
        () => {
          if (!aborted) {
            setTitle()
          }
        },
        err => {
          store.log.error('Failed to fetch thread', err)
        },
      )
    }
    return () => {
      aborted = true
      threadCleanup()
    }
  }, [visible, store.nav, store.log, store.shell, name, navIdx, view])

  return (
    <View style={s.h100pct}>
      <ViewHeader title="Post" subtitle={viewSubtitle} />
      <View style={s.h100pct}>
        <PostThreadComponent uri={uri} view={view} />
      </View>
    </View>
  )
}
