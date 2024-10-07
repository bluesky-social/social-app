import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {isWeb} from 'platform/detection'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {atoms as a} from '#/alf'
import {ListHeaderDesktop} from '#/components/Lists'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>
export const PostQuotesScreen = ({route}: Props) => {
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
    <CenteredView style={a.util_screen_outer} sideBorders={true}>
      <ListHeaderDesktop title={_(msg`Quotes`)} />
      <ViewHeader title={_(msg`Quotes`)} showBorder={!isWeb} />
      <PostQuotesComponent uri={uri} />
    </CenteredView>
  )
}
