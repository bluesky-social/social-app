import {
  CommonNavigatorParams,
  NativeStackScreenProps,
  NavigationProp,
} from 'lib/routes/types'
import React, {useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {ComposePrompt} from 'view/com/composer/Prompt'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {PostThreadModel} from 'state/models/content/post-thread'
import {ViewHeader} from '../com/util/ViewHeader'
import {clamp} from 'lodash'
import {isDesktopWeb} from 'platform/detection'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useStores} from 'state/index'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'

const SHELL_FOOTER_HEIGHT = 44

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export const PostThreadScreen = withAuthRequired(({route}: Props) => {
  const store = useStores()
  const safeAreaInsets = useSafeAreaInsets()
  const navigation = useNavigation<NavigationProp>()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const view = useMemo<PostThreadModel>(
    () => new PostThreadModel(store, {uri}),
    [store, uri],
  )

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
      const threadCleanup = view.registerListeners()
      if (!view.hasLoaded && !view.isLoading) {
        view.setup().catch(err => {
          store.log.error('Failed to fetch thread', err)
        })
      }
      return () => {
        threadCleanup()
      }
    }, [store, view]),
  )

  const onPressReply = React.useCallback(async () => {
    if (!view.thread) {
      return
    }
    if (store.session.isDefaultSession) {
      return navigation.navigate('SignIn')
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
  }, [view, store, navigation])

  return (
    <View style={s.hContentRegion}>
      <ViewHeader title="Post" />
      <View style={s.hContentRegion}>
        <PostThreadComponent
          uri={uri}
          view={view}
          onPressReply={onPressReply}
        />
      </View>
      {!isDesktopWeb && !store.session.isDefaultSession && (
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
