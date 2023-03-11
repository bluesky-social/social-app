import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostVotedBy as PostLikedByComponent} from '../com/post-thread/PostVotedBy'
import {useStores} from 'state/index'
import {makeRecordUri} from 'lib/strings/url-helpers'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostUpvotedBy'>
export const PostUpvotedByScreen = ({route}: Props) => {
  const store = useStores()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Liked by" />
      <PostLikedByComponent uri={uri} direction="up" />
    </View>
  )
}
