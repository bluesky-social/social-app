import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostRepostedBy as PostRepostedByComponent} from '../com/post-thread/PostRepostedBy'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostRepostedBy'>
export const PostRepostedByScreen = ({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const setMinimalShellMode = useSetMinimalShellMode()
  const {_} = useLingui()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Reposted By`)} />
      <PostRepostedByComponent uri={uri} />
    </View>
  )
}
