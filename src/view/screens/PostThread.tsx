import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ComposePrompt} from 'view/com/composer/Prompt'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  RQKEY as POST_THREAD_RQKEY,
  ThreadNode,
} from '#/state/queries/post-thread'
import {clamp} from 'lodash'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {useSetMinimalShellMode} from '#/state/shell'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {ErrorMessage} from '../com/util/error/ErrorMessage'
import {CenteredView} from '../com/util/Views'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export const PostThreadScreen = withAuthRequired(
  observer(function PostThreadScreenImpl({route}: Props) {
    const store = useStores()
    const queryClient = useQueryClient()
    const {fabMinimalShellTransform} = useMinimalShellMode()
    const setMinimalShellMode = useSetMinimalShellMode()
    const safeAreaInsets = useSafeAreaInsets()
    const {name, rkey} = route.params
    const {isMobile} = useWebMediaQueries()
    const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
    const {data: resolvedUri, error: uriError} = useResolveUriQuery(uri)

    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
      }, [setMinimalShellMode]),
    )

    const onPressReply = React.useCallback(() => {
      if (!resolvedUri) {
        return
      }
      const thread = queryClient.getQueryData<ThreadNode>(
        POST_THREAD_RQKEY(resolvedUri.uri),
      )
      if (thread?.type !== 'post') {
        return
      }
      store.shell.openComposer({
        replyTo: {
          uri: thread.post.uri,
          cid: thread.post.cid,
          text: thread.record.text,
          author: {
            handle: thread.post.author.handle,
            displayName: thread.post.author.displayName,
            avatar: thread.post.author.avatar,
          },
        },
        onPost: () =>
          queryClient.invalidateQueries({
            queryKey: POST_THREAD_RQKEY(resolvedUri.uri || ''),
          }),
      })
    }, [store, queryClient, resolvedUri])

    return (
      <View style={s.hContentRegion}>
        {isMobile && <ViewHeader title="Post" />}
        <View style={s.flex1}>
          {uriError ? (
            <CenteredView>
              <ErrorMessage message={String(uriError)} />
            </CenteredView>
          ) : (
            <PostThreadComponent
              uri={resolvedUri?.uri}
              onPressReply={onPressReply}
            />
          )}
        </View>
        {isMobile && (
          <Animated.View
            style={[
              styles.prompt,
              fabMinimalShellTransform,
              {
                bottom: clamp(safeAreaInsets.bottom, 15, 30),
              },
            ]}>
            <ComposePrompt onPressCompose={onPressReply} />
          </Animated.View>
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
