import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ComposePrompt} from 'view/com/composer/Prompt'
import {useStores} from 'state/index'
import {useQueryClient} from '@tanstack/react-query'
import {getCachedPost} from '#/state/queries/post'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {clamp} from 'lodash'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useMinimalShellMode, useSetMinimalShellMode} from '#/state/shell'

const SHELL_FOOTER_HEIGHT = 44

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export const PostThreadScreen = withAuthRequired(
  observer(function PostThreadScreenImpl({route}: Props) {
    const store = useStores()
    const queryClient = useQueryClient()
    const minimalShellMode = useMinimalShellMode()
    const setMinimalShellMode = useSetMinimalShellMode()
    const safeAreaInsets = useSafeAreaInsets()
    const {name, rkey} = route.params
    const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
    const {isMobile} = useWebMediaQueries()

    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
      }, [setMinimalShellMode]),
    )

    const onPressReply = React.useCallback(() => {
      const post = getCachedPost(queryClient, uri)
      if (!post) {
        return
      }
      store.shell.openComposer({
        replyTo: {
          uri: post.uri,
          cid: post.cid,
          text:
            'text' in post.record && typeof post.record.text === 'string'
              ? post.record.text
              : '',
          author: {
            handle: post.author.handle,
            displayName: post.author.displayName,
            avatar: post.author.avatar,
          },
        },
        // onPost: () => view.refresh(), TODO need to trigger this elsewhere
      })
    }, [store, queryClient, uri])

    return (
      <View style={s.hContentRegion}>
        {isMobile && <ViewHeader title="Post" />}
        <View style={s.flex1}>
          <PostThreadComponent
            uri={uri}
            onPressReply={onPressReply}
            treeView={!!store.preferences.thread.lab_treeViewEnabled}
          />
        </View>
        {isMobile && !minimalShellMode && (
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
  }),
)

const styles = StyleSheet.create({
  prompt: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
})
