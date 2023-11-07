import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostRepostedBy as PostRepostedByComponent} from '../com/post-thread/PostRepostedBy'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostRepostedBy'>
export const PostRepostedByScreen = withAuthRequired(({route}: Props) => {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const setMinimalShellMode = useSetMinimalShellMode()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title="Reposted by" />
      <PostRepostedByComponent uri={uri} />
    </View>
  )
})
