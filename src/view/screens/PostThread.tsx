import React from 'react'
import {StyleSheet, useWindowDimensions, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostThread as PostThreadComponent} from '#/view/com/post-thread/PostThread'
import * as Layout from '#/components/Layout'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useGetPostThreadV2} from '#/state/queries/useGetPostThreadV2'

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
      {/* <PostThreadComponent uri={uri} /> */}
      <Inner uri={uri} />
    </Layout.Screen>
  )
}

export function Inner({uri}: {uri: string | undefined}) {
  const {hasSession, currentAccount} = useSession()
  const {_} = useLingui()
  const t = useTheme()
  const initialNumToRender = useInitialNumToRender()
  const {height: windowHeight} = useWindowDimensions()
  const headerRef = React.useRef<View | null>(null)

  const {
    data,
  } = useGetPostThreadV2(uri)
  console.log(data)
  return null
}
