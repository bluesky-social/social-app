import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useSetMinimalShellMode} from '#/state/shell'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeedLikedBy'>
export const ProfileFeedLikedByScreen = ({route}: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.generator', rkey)
  const {_} = useLingui()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View style={{flex: 1}}>
      <ViewHeader title={_(msg`Liked By`)} />
      <PostLikedByComponent uri={uri} />
    </View>
  )
}
