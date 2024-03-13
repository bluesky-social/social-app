import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Link} from './Link'
import {isWeb} from 'platform/detection'
import {makeProfileLink} from 'lib/routes/links'
import {usePrefetchProfileQuery} from '#/state/queries/profile'

interface UserPreviewLinkProps {
  did: string
  handle: string
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
      style={props.style}>
      {props.children}
    </Link>
  )
}
