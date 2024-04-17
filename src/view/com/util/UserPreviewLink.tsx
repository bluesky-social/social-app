import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'

import {usePrefetchProfileQuery} from '#/state/queries/profile'
import {makeProfileLink} from 'lib/routes/links'
import {isWeb} from 'platform/detection'
import {Link} from './Link'

interface UserPreviewLinkProps {
  did: string
  handle: string
  onBeforePress?: () => void
  style?: StyleProp<ViewStyle>
}
export function UserPreviewLink(
  props: React.PropsWithChildren<UserPreviewLinkProps>,
) {
  const prefetchProfileQuery = usePrefetchProfileQuery()
  return (
    <Link
      onPointerEnter={() => {
        if (isWeb) {
          prefetchProfileQuery(props.did)
        }
      }}
      href={makeProfileLink(props)}
      title={props.handle}
      asAnchor
      onBeforePress={props.onBeforePress}
      style={props.style}>
      {props.children}
    </Link>
  )
}
