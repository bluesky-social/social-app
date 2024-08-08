import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {
  RQKEY as POST_THREAD_RQKEY,
  ThreadNode,
} from '#/state/queries/post-thread'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {s} from 'lib/styles'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const queryClient = useQueryClient()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {openComposer} = useComposerControls()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onPressReply = React.useCallback(() => {
    if (!uri) {
      return
    }
    const thread = queryClient.getQueryData<ThreadNode>(POST_THREAD_RQKEY(uri))
    if (thread?.type !== 'post') {
      return
    }
    openComposer({
      replyTo: {
        uri: thread.post.uri,
        cid: thread.post.cid,
        text: thread.record.text,
        author: thread.post.author,
        embed: thread.post.embed,
      },
      onPost: () =>
        queryClient.invalidateQueries({
          queryKey: POST_THREAD_RQKEY(uri),
        }),
    })
  }, [openComposer, queryClient, uri])

  return (
    <View style={s.hContentRegion}>
      <View style={s.flex1}>
        <PostThreadComponent uri={uri} onPressReply={onPressReply} />
      </View>
    </View>
  )
}
