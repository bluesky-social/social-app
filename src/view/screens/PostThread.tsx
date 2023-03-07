import React, {useEffect, useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ComposePrompt} from 'view/com/composer/Prompt'
import {PostThreadViewModel} from 'state/models/post-thread-view'
import {ScreenParams} from '../routes'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lodash'

const SHELL_FOOTER_HEIGHT = 44

export const PostThread = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const safeAreaInsets = useSafeAreaInsets()
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

  const onPressReply = React.useCallback(() => {
    if (!view.thread) {
      return
    }
    store.shell.openComposer({
      replyTo: {
        uri: view.thread.post.uri,
        cid: view.thread.post.cid,
        text: view.thread.postRecord?.text as string,
        author: {
          handle: view.thread.post.author.handle,
          displayName: view.thread.post.author.displayName,
          avatar: view.thread.post.author.avatar,
        },
      },
      onPost: () => view.refresh(),
    })
  }, [view, store])

  return (
    <View style={s.hContentRegion}>
      <ViewHeader title="Post" />
      <View style={s.hContentRegion}>
        <PostThreadComponent uri={uri} view={view} />
      </View>
      <View
        style={[
          styles.prompt,
          {bottom: SHELL_FOOTER_HEIGHT + clamp(safeAreaInsets.bottom, 15, 30)},
        ]}>
        <ComposePrompt onPressCompose={onPressReply} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  prompt: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
})
