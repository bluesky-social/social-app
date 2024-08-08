import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useSetMinimalShellMode} from '#/state/shell'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {PostRepostedBy as PostRepostedByComponent} from '../com/post-thread/PostRepostedBy'
import {ViewHeader} from '../com/util/ViewHeader'

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
    <View style={{flex: 1}}>
      <ViewHeader title={_(msg`Reposted By`)} />
      <PostRepostedByComponent uri={uri} />
    </View>
  )
}
