import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {isWeb} from '#/platform/detection'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostLikedBy as PostLikedByComponent} from '#/view/com/post-thread/PostLikedBy'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'
import {ListHeaderDesktop} from '#/components/Lists'

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
    <Layout.Screen>
      <CenteredView sideBorders={true}>
        <ListHeaderDesktop title={_(msg`Liked By`)} />
        <ViewHeader title={_(msg`Liked By`)} showBorder={!isWeb} />
        <PostLikedByComponent uri={uri} />
      </CenteredView>
    </Layout.Screen>
  )
}
