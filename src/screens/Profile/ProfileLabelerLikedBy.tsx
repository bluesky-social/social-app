import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {useSetMinimalShellMode} from '#/state/shell'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {atoms as a, useBreakpoints} from '#/alf'
import {LikedByList} from '#/components/LikedByList'

export function ProfileLabelerLikedByScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'ProfileLabelerLikedBy'>) {
  const setMinimalShellMode = useSetMinimalShellMode()
  const {name: handleOrDid} = route.params
  const uri = makeRecordUri(handleOrDid, 'app.bsky.labeler.service', 'self')
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View
      style={[
        a.mx_auto,
        a.w_full,
        a.h_full_vh,
        gtMobile && [
          {
            maxWidth: 600,
          },
        ],
      ]}>
      <ViewHeader title={_(msg`Liked By`)} />
      <LikedByList uri={uri} />
    </View>
  )
}
