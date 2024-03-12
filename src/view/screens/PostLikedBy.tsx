import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import React from 'react'
import {View} from 'react-native'

import {useSetMinimalShellMode} from '#/state/shell'

import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostLikedBy'>
export const PostLikedByScreen = ({route}: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const {_} = useLingui()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Liked By`)} />
      <PostLikedByComponent uri={uri} />
    </View>
  )
}
