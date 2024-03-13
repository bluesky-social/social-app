import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

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
    <View>
      <ViewHeader title={_(msg`Liked By`)} />
      <PostLikedByComponent uri={uri} />
    </View>
  )
}
