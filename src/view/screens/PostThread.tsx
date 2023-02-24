import React, {useEffect, useMemo} from 'react'
import {View} from 'react-native'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {PostThreadViewModel} from 'state/models/post-thread-view'
import {ScreenParams} from '../routes'
import {useStores} from 'state/index'
import {s} from 'lib/styles'

export const PostThread = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name, rkey} = params
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
    <View style={s.hContentRegion}>
      <ViewHeader title="Post" />
      <View style={s.hContentRegion}>
        <PostThreadComponent uri={uri} view={view} />
      </View>
    </View>
  )
}
