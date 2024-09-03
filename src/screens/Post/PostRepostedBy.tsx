import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {isWeb} from 'platform/detection'
import {PostRepostedBy as PostRepostedByComponent} from '#/view/com/post-thread/PostRepostedBy'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {atoms as a} from '#/alf'
import {ListHeaderDesktop} from '#/components/Lists'

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
    <CenteredView style={a.util_screen_outer} sideBorders={true}>
      <ListHeaderDesktop title={_(msg`Reposted By`)} />
      <ViewHeader title={_(msg`Reposted By`)} showBorder={!isWeb} />
      <PostRepostedByComponent uri={uri} />
    </CenteredView>
  )
}
