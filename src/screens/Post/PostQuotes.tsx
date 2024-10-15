import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {isWeb} from '#/platform/detection'
import {useSetMinimalShellMode} from '#/state/shell'
import {PostQuotes as PostQuotesComponent} from '#/view/com/post-thread/PostQuotes'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'
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
    <Layout.Screen>
      <CenteredView sideBorders={true}>
        <ListHeaderDesktop title={_(msg`Quotes`)} />
        <ViewHeader title={_(msg`Quotes`)} showBorder={!isWeb} />
        <PostQuotesComponent uri={uri} />
      </CenteredView>
    </Layout.Screen>
  )
}
