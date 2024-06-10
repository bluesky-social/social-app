import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {clamp} from 'lodash'

import {isWeb} from '#/platform/detection'
import {
  RQKEY as POST_THREAD_RQKEY,
  ThreadNode,
} from '#/state/queries/post-thread'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useComposerControls} from '#/state/shell/composer'
import {useMinimalShellFabTransform} from 'lib/hooks/useMinimalShellTransform'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {s} from 'lib/styles'
import {ComposePrompt} from 'view/com/composer/Prompt'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const queryClient = useQueryClient()
  const {hasSession} = useSession()
  const fabMinimalShellTransform = useMinimalShellFabTransform()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {openComposer} = useComposerControls()
  const safeAreaInsets = useSafeAreaInsets()
  const {name, rkey} = route.params
  const {isMobile} = useWebMediaQueries()
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const [canReply, setCanReply] = React.useState(false)

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
        <PostThreadComponent
          uri={uri}
          onPressReply={onPressReply}
          onCanReply={setCanReply}
        />
      </View>
      {isMobile && canReply && hasSession && (
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
}

const styles = StyleSheet.create({
  prompt: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    left: 0,
    right: 0,
  },
})
