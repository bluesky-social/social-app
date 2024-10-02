import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostThread as PostThreadComponent} from '#/view/com/post-thread/PostThread'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const setMinimalShellMode = useSetMinimalShellMode()

  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <Layout.Screen testID="postThreadScreen">
      <View style={a.flex_1}>
        <PostThreadComponent uri={uri} />
      </View>
    </Layout.Screen>
  )
}
