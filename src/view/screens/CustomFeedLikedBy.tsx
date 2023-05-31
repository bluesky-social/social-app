import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {useStores} from 'state/index'
import {makeRecordUri} from 'lib/strings/url-helpers'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomFeedLikedBy'>
export const CustomFeedLikedByScreen = withAuthRequired(({route}: Props) => {
  const store = useStores()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.generator', rkey)

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Liked by" />
      <PostLikedByComponent uri={uri} />
    </View>
  )
})
