import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostThread as PostThreadComponent} from '#/view/com/post-thread/PostThread'
import {PostThread} from '#/screens/PostThread'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const setMinimalShellMode = useSetMinimalShellMode()
  const gate = useGate()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="postThreadScreen">
      {gate('post_threads_v2_unspecced') || __DEV__ ? (
        <PostThread uri={uri} />
      ) : (
        <PostThreadComponent uri={uri} />
      )}
    </Layout.Screen>
  )
}
