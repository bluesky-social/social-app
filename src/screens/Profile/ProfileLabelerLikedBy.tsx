import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import * as Layout from '#/components/Layout'
import {LikedByList} from '#/components/LikedByList'

export function ProfileLabelerLikedByScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'ProfileLabelerLikedBy'>) {
  const {name: handleOrDid} = route.params
  const uri = makeRecordUri(handleOrDid, 'app.bsky.labeler.service', 'self')
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Liked By`)} />
      <LikedByList uri={uri} />
    </Layout.Screen>
  )
}
