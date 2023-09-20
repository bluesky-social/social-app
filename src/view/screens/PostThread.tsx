import React, {useMemo} from 'react'
import {InteractionManager, StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ComposePrompt} from 'view/com/composer/Prompt'
import {PostThreadModel} from 'state/models/content/post-thread'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lodash'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

const SHELL_FOOTER_HEIGHT = 44

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export const PostThreadScreen = withAuthRequired(({route}: Props) => {
  const store = useStores()
  const safeAreaInsets = useSafeAreaInsets()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const view = useMemo<PostThreadModel>(
    () => new PostThreadModel(store, {uri}),
    [store, uri],
  )
  const {isMobile} = useWebMediaQueries()

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
      const threadCleanup = view.registerListeners()

      InteractionManager.runAfterInteractions(() => {
        if (!view.hasLoaded && !view.isLoading) {
          view.setup().catch(err => {
            store.log.error('Failed to fetch thread', err)
          })
        }
      })

      return () => {
        threadCleanup()
      }
    }, [store, view]),
  )

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
      {isMobile && <ViewHeader title="Post" />}
      <View style={s.flex1}>
        <PostThreadComponent
          uri={uri}
          view={view}
          onPressReply={onPressReply}
          treeView={store.preferences.threadTreeViewEnabled}
        />
      </View>
      {isMobile && !store.shell.minimalShellMode && (
        <View
          style={[
            styles.prompt,
            {
              bottom:
                SHELL_FOOTER_HEIGHT + clamp(safeAreaInsets.bottom, 15, 30),
            },
          ]}>
          <ComposePrompt onPressCompose={onPressReply} />
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  prompt: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
})
